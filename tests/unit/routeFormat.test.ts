import test from "node:test";
import assert from "node:assert/strict";

import { formatEtaTime, formatHourMinute, parseTimeInput } from "@/src/features/route/utils/routeFormat";

// Reads a Date's wall-clock hours/minutes in Europe/Berlin specifically —
// used instead of getHours()/getMinutes() (device-local) so these tests pass
// no matter which timezone the machine running them is actually set to.
function europeBerlinHourMinute(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  return `${hour}:${minute}`;
}

test("parseTimeInput accepts a valid HH:mm value, interpreted as Europe/Berlin time regardless of the machine's own timezone", () => {
  const reference = new Date("2026-08-30T00:00:00.000Z");
  const result = parseTimeInput("08:30", reference);

  assert.ok(result);
  assert.equal(europeBerlinHourMinute(result as Date), "08:30");
});

test("parseTimeInput and formatEtaTime round-trip through Europe/Berlin consistently", () => {
  const reference = new Date("2026-01-15T00:00:00.000Z");
  const result = parseTimeInput("14:00", reference);

  assert.ok(result);
  assert.equal(formatEtaTime(result as Date), "14:00");
});

test("parseTimeInput rejects invalid hours or minutes", () => {
  assert.equal(parseTimeInput("24:00"), null);
  assert.equal(parseTimeInput("12:60"), null);
});

test("parseTimeInput rejects malformed input", () => {
  assert.equal(parseTimeInput("not-a-time"), null);
  assert.equal(parseTimeInput(""), null);
});

test("formatHourMinute zero-pads hours and minutes", () => {
  assert.equal(formatHourMinute(0, 0), "00:00");
  assert.equal(formatHourMinute(9, 5), "09:05");
  assert.equal(formatHourMinute(23, 45), "23:45");
});

test("formatEtaTime always renders 24h format, never 12h AM/PM", () => {
  const afternoon = new Date("2026-08-30T14:05:00.000Z");
  const formatted = formatEtaTime(afternoon);

  assert.match(formatted, /^\d{2}:\d{2}$/);
  assert.ok(!/[ap]\.?m\.?/i.test(formatted));
});

test("formatEtaTime shows Europe/Berlin time, not the raw UTC hour, in both DST states", () => {
  // 2026-08-30T14:05:00Z is summer (Europe/Berlin = UTC+2) -> 16:05.
  assert.equal(formatEtaTime(new Date("2026-08-30T14:05:00.000Z")), "16:05");
  // 2026-01-15T14:05:00Z is winter (Europe/Berlin = UTC+1) -> 15:05.
  assert.equal(formatEtaTime(new Date("2026-01-15T14:05:00.000Z")), "15:05");
});
