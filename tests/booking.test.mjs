import assert from "node:assert/strict";
import test from "node:test";
import { createAvailableSlots, localDateTimeToIso } from "../lib/booking.js";

test("creates local-time slots and excludes occupied appointments", () => {
  const slots = createAvailableSlots({
    date: "2030-01-07",
    staffId: "staff-1",
    service: { durationMinutes: 60, bufferMinutes: 0 },
    workingHours: [{ staffId: "staff-1", weekday: 1, startsAt: "09:00", endsAt: "13:00" }],
    appointments: [{ startsAt: "2030-01-07T13:00:00.000Z", endsAt: "2030-01-07T14:00:00.000Z", status: "pending" }],
    timeZone: "America/Sao_Paulo",
    now: Date.parse("2029-01-01T00:00:00.000Z"),
  });

  assert.deepEqual(slots.map(({ time }) => time), ["09:00", "11:00", "11:30", "12:00"]);
  assert.equal(slots[0].startsAt, "2030-01-07T12:00:00.000Z");
});

test("rejects invalid dates and nonexistent daylight-saving times", () => {
  assert.throws(() => localDateTimeToIso("2030-02-30", "09:00", "America/Sao_Paulo"), RangeError);
  assert.throws(() => localDateTimeToIso("2024-03-10", "02:30", "America/New_York"), RangeError);
});
