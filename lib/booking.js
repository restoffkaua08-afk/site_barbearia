const SLOT_INTERVAL_MINUTES = 30;

function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

function partsAt(instant, timeZone) {
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(instant)).map(({ type, value }) => [type, value]));
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value)]));
}

export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDays(date, count) {
  const parsed = parseDate(date);
  if (!parsed) throw new RangeError("Data inválida.");
  parsed.setUTCDate(parsed.getUTCDate() + count);
  return parsed.toISOString().slice(0, 10);
}

export function dateKeyInTimeZone(instant, timeZone) {
  const parts = partsAt(instant, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function localDateTimeToIso(date, time, timeZone) {
  const day = parseDate(date);
  const clock = /^(\d{2}):(\d{2})$/.exec(time);
  if (!day || !clock || Number(clock[1]) > 23 || Number(clock[2]) > 59) throw new RangeError("Data ou horário inválido.");
  const expected = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), Number(clock[1]), Number(clock[2]));
  let instant = expected;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = partsAt(instant, timeZone);
    const represented = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const difference = expected - represented;
    if (!difference) break;
    instant += difference;
  }
  const result = partsAt(instant, timeZone);
  if (result.year !== day.getUTCFullYear() || result.month !== day.getUTCMonth() + 1 || result.day !== day.getUTCDate() || result.hour !== Number(clock[1]) || result.minute !== Number(clock[2])) {
    throw new RangeError("Esse horário não existe no fuso do estabelecimento.");
  }
  return new Date(instant).toISOString();
}

export function formatDateKey(date, timeZone, options = { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone, ...options }).format(new Date(localDateTimeToIso(date, "12:00", timeZone)));
}

export function createAvailableSlots({ date, staffId, service, workingHours, appointments, timeZone, now = Date.now() }) {
  const parsedDate = parseDate(date);
  if (!parsedDate || !service || !staffId || !timeZone) return [];
  const weekday = parsedDate.getUTCDay();
  const duration = Number(service.durationMinutes) + Number(service.bufferMinutes ?? 0);
  if (!Number.isFinite(duration) || duration <= 0) return [];
  const occupied = (appointments ?? []).filter((item) => item.status === "pending" || item.status === "confirmed");
  const result = new Map();

  for (const hours of workingHours ?? []) {
    if (hours.staffId !== staffId || Number(hours.weekday) !== weekday) continue;
    const start = /^(\d{2}):(\d{2})$/.exec(hours.startsAt);
    const end = /^(\d{2}):(\d{2})$/.exec(hours.endsAt);
    if (!start || !end) continue;
    const startMinute = Number(start[1]) * 60 + Number(start[2]);
    const endMinute = Number(end[1]) * 60 + Number(end[2]);
    for (let minute = startMinute; minute + duration <= endMinute; minute += SLOT_INTERVAL_MINUTES) {
      const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
      let startsAt;
      let endsAt;
      try {
        startsAt = localDateTimeToIso(date, time, timeZone);
        endsAt = new Date(Date.parse(startsAt) + duration * 60_000).toISOString();
      } catch { continue; }
      if (Date.parse(startsAt) <= now) continue;
      const collision = occupied.some((item) => Date.parse(item.startsAt) < Date.parse(endsAt) && Date.parse(item.endsAt) > Date.parse(startsAt));
      if (!collision) result.set(time, { time, startsAt });
    }
  }

  return [...result.values()].sort((a, b) => a.time.localeCompare(b.time));
}
