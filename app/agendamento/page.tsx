"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { createAvailableSlots, addDays, dateKey, dateKeyInTimeZone, formatDateKey } from "@/lib/booking.js";

type Service = { id: string; name: string; description: string; durationMinutes: number; bufferMinutes: number; price?: number };
type Professional = { id: string; name: string; serviceIds: string[] };
type WorkingHours = { staffId: string; weekday: number; startsAt: string; endsAt: string };
type Catalog = { tenant: { name: string; timezone: string }; services: Service[]; staff: Professional[]; workingHours: WorkingHours[] };
type Slot = { time: string; startsAt: string };
type BookingError = Error & { code?: string; status?: number };

function formatBrazilianPhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  const ddd = digits.slice(0, 2);
  const local = digits.slice(2);
  if (local.length <= 4) return `(${ddd}) ${local}`;
  if (local.length <= 8) return `(${ddd}) ${local.slice(0, 4)}-${local.slice(4)}`;
  return `(${ddd}) ${local.slice(0, 5)}-${local.slice(5)}`;
}

function normalizeBrazilianPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("55")) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return null;
  if (!/^[1-9]\d$/.test(digits.slice(0, 2))) return null;
  if (digits.length === 11 && digits[2] !== "9") return null;
  return `+55${digits}`;
}

async function apiJson<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(path, { ...options, cache: "no-store" }); }
  catch (reason) {
    if (reason instanceof Error && reason.name === "AbortError") throw reason;
    throw new Error("Não foi possível acessar a agenda. Confira sua conexão e tente novamente.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Não foi possível concluir agora. Tente novamente.") as BookingError;
    error.code = data.code;
    error.status = response.status;
    throw error;
  }
  return data as T;
}

export default function BookingPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState<Date>();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [refreshSlots, setRefreshSlots] = useState(0);
  const [booking, setBooking] = useState<{ readableNumber: string; startsAt: string } | null>(null);
  const idempotency = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiJson<Catalog>("/api/appointments?catalog=1", { signal: controller.signal })
      .then((data) => {
        setCatalog(data);
        const requested = new URLSearchParams(window.location.search).get("servico");
        const index = Number(requested);
        const selected = requested && Number.isInteger(index) && index >= 0
          ? data.services[index]?.id
          : data.services.find((item) => item.id === requested)?.id;
        setServiceId(selected ?? data.services[0]?.id ?? "");
      })
      .catch((reason) => { if (reason.name !== "AbortError") setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoadingCatalog(false); });
    return () => controller.abort();
  }, []);

  const service = catalog?.services.find((item) => item.id === serviceId);
  const professionals = useMemo(() => catalog?.staff.filter((item) => item.serviceIds.includes(serviceId)) ?? [], [catalog, serviceId]);

  useEffect(() => {
    if (!professionals.some((item) => item.id === staffId)) setStaffId(professionals[0]?.id ?? "");
  }, [professionals, staffId]);

  const selectedDate = date ? dateKey(date) : "";
  const todayKey = catalog ? dateKeyInTimeZone(Date.now(), catalog.tenant.timezone) : dateKey(new Date());
  const maxDateKey = addDays(todayKey, 90);

  useEffect(() => {
    setSelectedTime("");
    setSlots([]);
    if (!selectedDate || !staffId || !service || !catalog) return;
    const controller = new AbortController();
    setLoadingSlots(true);
    setError("");
    apiJson<{ appointments: Array<{ startsAt: string; endsAt: string; status: string }> }>(
      `/api/appointments?staffId=${encodeURIComponent(staffId)}&date=${selectedDate}`,
      { signal: controller.signal },
    ).then(({ appointments }) => {
      setSlots(createAvailableSlots({ date: selectedDate, staffId, service, workingHours: catalog.workingHours, appointments, timeZone: catalog.tenant.timezone }));
    }).catch((reason) => { if (reason.name !== "AbortError") setError(reason.message || "Não foi possível consultar os horários."); })
      .finally(() => { if (!controller.signal.aborted) setLoadingSlots(false); });
    return () => controller.abort();
  }, [catalog, selectedDate, service, staffId, refreshSlots]);

  const formattedDate = selectedDate && catalog ? formatDateKey(selectedDate, catalog.tenant.timezone) : "";
  const chosenSlot = slots.find((item) => item.time === selectedTime);
  const nameValid = name.trim().length >= 2;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length >= 8 && phoneDigits.length <= 15;

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service || !staffId || !chosenSlot || !nameValid || !emailValid || !phoneValid || submitting) return;
    setSubmitting(true);
    setError("");
    const payload = { serviceId: service.id, staffId, startsAt: chosenSlot.startsAt, customerName: name.trim(), customerEmail: email.trim(), customerPhone: normalizedPhone!, whatsappOptIn };
    const fingerprint = JSON.stringify(payload);
    const attempt = idempotency.current?.fingerprint === fingerprint
      ? idempotency.current
      : { fingerprint, key: crypto.randomUUID() };
    idempotency.current = attempt;
    try {
      const result = await apiJson<{ appointment: { readableNumber: string; startsAt: string } }>("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": attempt.key },
        body: fingerprint,
      });
      setBooking(result.appointment);
      idempotency.current = null;
    } catch (reason) {
      const failure = reason as BookingError;
      if (failure.code === "SLOT_UNAVAILABLE") {
        setSelectedTime("");
        setError("Esse horário acabou de ser ocupado. Atualizamos a disponibilidade; escolha outro.");
        setRefreshSlots((value) => value + 1);
        idempotency.current = null;
      } else setError(failure.message || "Não foi possível concluir o agendamento.");
    } finally { setSubmitting(false); }
  }

  if (booking && service && catalog) {
    return <main className="booking-page"><section className="booking-success" aria-live="polite">
      <img src="/logo-bn-gold.png" alt="Monograma BN"/><p className="overline">Solicitação enviada</p>
      <h1>Recebemos seu pedido.</h1><p>Obrigado, <strong>{name.trim()}</strong>. A equipe da {catalog.tenant.name} vai analisar sua solicitação e confirmar o horário.</p>
      <div className="booking-receipt"><span>Protocolo <strong>{booking.readableNumber}</strong></span><span>{service.name}</span><strong>{formatDateKey(selectedDate, catalog.tenant.timezone)} · {new Intl.DateTimeFormat("pt-BR", { timeZone: catalog.tenant.timezone, hour: "2-digit", minute: "2-digit" }).format(new Date(booking.startsAt))}</strong></div>
      <p className="success-note">Acompanhe a confirmação pelo contato informado.</p><a className="book" href="/">Voltar ao site</a>
    </section></main>;
  }

  return <main className="booking-page">
    <header className="booking-nav"><a className="brand" href="/"><img src="/logo-bn-gold.png" alt=""/><strong>Barbearia Nilles</strong></a><a href="/#servicos">← Voltar aos serviços</a></header>
    <section className="booking-hero" style={{ backgroundImage: `linear-gradient(90deg,#100a06 0%,#100a06bd 47%,transparent 78%),linear-gradient(0deg,#100a06,transparent 45%),url(${service ? "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1500&q=90" : "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1500&q=90"})` }}>
      <div><p className="overline">Barbearia Nilles · Contagem</p><h1>Seu horário,<br/>do seu jeito.</h1><p>Escolha serviço, profissional e um horário livre. A equipe confirma sua solicitação pelo contato informado.</p></div>
    </section>
    <section className="booking-flow">
      <aside className="booking-intro"><p className="overline">Agendamento online</p><h2>Reserve em poucos passos.</h2><p>Veja a disponibilidade atualizada e envie seu pedido para a barbearia.</p>
        <ol><li className={service ? "complete" : "active"}><span>01</span> Serviço</li><li className={staffId ? "complete" : service ? "active" : ""}><span>02</span> Profissional</li><li className={selectedTime ? "complete" : selectedDate ? "active" : ""}><span>03</span> Dia e horário</li><li className={booking ? "complete" : selectedTime ? "active" : ""}><span>04</span> Seus dados</li></ol>
        <div className="booking-trust"><span aria-hidden="true">✓</span><p><strong>Reserva protegida</strong><br/>O horário só fica ocupado após o sistema validar a disponibilidade.</p></div>
      </aside>
      <div className="booking-panel">
        {loadingCatalog ? <div className="booking-feedback" role="status">Carregando serviços e horários…</div> : !catalog || !catalog.services.length ? <div className="booking-feedback booking-feedback-error" role="alert">{error || "A agenda online está temporariamente indisponível. Tente novamente mais tarde."}<button type="button" className="booking-retry" onClick={() => window.location.reload()}>Tentar novamente</button></div> : <>
          <section className="booking-section"><div className="booking-section-title"><span>01</span><div><h3>Escolha o serviço</h3><p>Selecione o que você quer fazer.</p></div></div>
            <div className="booking-services">{catalog.services.map((item) => <button type="button" key={item.id} className={`booking-service-option ${serviceId === item.id ? "selected" : ""}`} aria-pressed={serviceId === item.id} onClick={() => { setServiceId(item.id); setDate(undefined); setSelectedTime(""); setError(""); }}><span><strong>{item.name}</strong><small>{item.description || "Atendimento profissional"}</small></span><span className="booking-service-meta"><strong>{item.durationMinutes} min</strong>{typeof item.price === "number" && <small>{item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</small>}</span></button>)}</div>
          </section>
          <section className="booking-section"><div className="booking-section-title"><span>02</span><div><h3>Quem vai atender?</h3><p>Escolha um profissional disponível para este serviço.</p></div></div>
            {professionals.length ? <div className="booking-professionals">{professionals.map((item) => <button type="button" key={item.id} className={`booking-professional-option ${staffId === item.id ? "selected" : ""}`} aria-pressed={staffId === item.id} onClick={() => { setStaffId(item.id); setDate(undefined); setSelectedTime(""); setError(""); }}><span className="booking-avatar" aria-hidden="true">{item.name.trim().charAt(0).toUpperCase()}</span><span><strong>{item.name}</strong><small>Profissional da barbearia</small></span><span className="booking-radio" aria-hidden="true"/></button>)}</div> : <p className="booking-feedback">Nenhum profissional está habilitado para este serviço. Fale com a barbearia.</p>}
          </section>
          <section className="booking-section"><div className="booking-section-title"><span>03</span><div><h3>Dia e horário</h3><p>Os horários livres são atualizados ao selecionar uma data.</p></div></div>
            <div className="booking-calendar-card"><Calendar mode="single" selected={date} onSelect={(value) => { setDate(value); setSelectedTime(""); setError(""); }} disabled={(value) => { const key = dateKey(value); return key < todayKey || key > maxDateKey; }} locale={ptBR} showOutsideDays={false}/></div>
            {date && <div className="slots"><p className="selected-date">Disponibilidade para <strong>{formattedDate}</strong></p>{loadingSlots ? <p className="slot-status" role="status">Consultando horários…</p> : slots.length ? <div className="slot-grid">{slots.map((slot) => <button type="button" key={slot.time} className={selectedTime === slot.time ? "selected" : ""} aria-pressed={selectedTime === slot.time} onClick={() => { setSelectedTime(slot.time); setError(""); }}>{slot.time}</button>)}</div> : <p className="slot-status">Não há horários livres neste dia. Escolha outra data.</p>}</div>}
          </section>
          {selectedTime && chosenSlot && <form className="booking-section booking-details" onSubmit={submitBooking}>
            <div className="booking-section-title"><span>04</span><div><h3>Seus dados</h3><p>A barbearia usará estas informações para identificar e confirmar seu pedido.</p></div></div>
            <div className="booking-fields-grid"><label>Nome completo<input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} autoComplete="name" placeholder="Como podemos te chamar?" required minLength={2}/></label><label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" placeholder="voce@exemplo.com" required/></label><label className="booking-phone-field">Celular com DDD<input type="tel" value={phone} onChange={(event) => setPhone(formatBrazilianPhone(event.target.value))} maxLength={16} autoComplete="tel" inputMode="tel" placeholder="(31) 99999-9999" required aria-describedby="phone-help"/><small id="phone-help">Informe DDD e celular brasileiro, por exemplo (31) 97105-1343. Usaremos o número para falar sobre seu agendamento.</small></label></div>
            <label className="booking-consent"><input type="checkbox" checked={whatsappOptIn} onChange={(event) => setWhatsappOptIn(event.target.checked)}/><span>Autorizo a barbearia a entrar em contato comigo pelo WhatsApp sobre este agendamento.</span></label>
            <div className="booking-summary"><span>{service?.name} · {professionals.find((item) => item.id === staffId)?.name}</span><strong>{formattedDate} · {selectedTime}</strong></div>
            {error && <p className="booking-error" role="alert">{error}</p>}
            <button className="book booking-submit" type="submit" disabled={!nameValid || !emailValid || !phoneValid || submitting}>{submitting ? "Enviando solicitação…" : "Solicitar agendamento ↗"}</button>
            <p className="booking-privacy">Ao continuar, seus dados serão enviados com segurança à Barbearia Nilles para processar esta solicitação.</p>
          </form>}
        </>}
      </div>
    </section>
  </main>;
}
