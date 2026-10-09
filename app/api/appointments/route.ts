export const dynamic = "force-dynamic";

function apiConfig() {
  const address = process.env.AGENDA_API_URL?.trim();
  const tenant = process.env.AGENDA_TENANT_SLUG?.trim();
  if (!address || !tenant || !/^[a-z0-9-]{2,50}$/.test(tenant)) return null;
  try {
    const url = new URL(address);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") return null;
    return { base: url.origin, tenant };
  } catch { return null; }
}

async function readBookingBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return { body: "", tooLarge: false };
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16_000) {
        await reader.cancel();
        return { body: "", tooLarge: true };
      }
      body += decoder.decode(value, { stream: true });
    }
    return { body: body + decoder.decode(), tooLarge: false };
  } finally {
    reader.releaseLock();
  }
}

async function forward(request: Request, path: string, body?: string) {
  const config = apiConfig();
  if (!config) return Response.json({ code: "AGENDA_NOT_CONFIGURED", message: "A agenda online está sendo preparada. Tente novamente mais tarde." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const headers = new Headers({ Accept: "application/json" });
  const realIp = request.headers.get("x-real-ip");
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (realIp) headers.set("x-real-ip", realIp);
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    const key = request.headers.get("idempotency-key");
    if (!key || key.length < 8 || key.length > 200) return Response.json({ code: "IDEMPOTENCY_KEY_REQUIRED", message: "Atualize a página e tente novamente." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    headers.set("Idempotency-Key", key);
  }
  try {
    const upstream = await fetch(new URL(path, `${config.base}/`), { method: body === undefined ? "GET" : "POST", headers, body, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12_000) });
    const data = await upstream.json().catch(() => ({ code: "INVALID_API_RESPONSE", message: "A agenda não respondeu corretamente." }));
    return Response.json(data, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ code: "AGENDA_UNAVAILABLE", message: "Não foi possível acessar a agenda agora. Tente novamente." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

export async function GET(request: Request) {
  const config = apiConfig();
  if (!config) return forward(request, "");
  const query = new URL(request.url).searchParams;
  if (query.get("catalog") === "1") return forward(request, `/v1/public/${config.tenant}/catalog`);
  const staffId = query.get("staffId") ?? "";
  const date = query.get("date") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(staffId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ code: "INVALID_QUERY", message: "Escolha um profissional e uma data válidos." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  return forward(request, `/v1/public/${config.tenant}/appointments?staffId=${encodeURIComponent(staffId)}&date=${encodeURIComponent(date)}`);
}

export async function POST(request: Request) {
  const config = apiConfig();
  if (!config) return Response.json({ code: "AGENDA_NOT_CONFIGURED", message: "A agenda online está sendo preparada. Tente novamente mais tarde." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const { body, tooLarge } = await readBookingBody(request);
  if (tooLarge) return Response.json({ code: "PAYLOAD_TOO_LARGE", message: "Confira os dados do agendamento." }, { status: 413, headers: { "Cache-Control": "no-store" } });
  try { JSON.parse(body); } catch { return Response.json({ code: "INVALID_BODY", message: "Confira os dados do agendamento." }, { status: 400, headers: { "Cache-Control": "no-store" } }); }
  return forward(request, `/v1/public/${config.tenant}/appointments`, body);
}
