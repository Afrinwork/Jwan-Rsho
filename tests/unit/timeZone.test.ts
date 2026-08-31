import test from "node:test";
import assert from "node:assert/strict";

import { getTimeZoneForCountry } from "@/src/utils/time/timeZone";
import { formatArrivalTime } from "@/src/utils/time/formatArrivalTime";

test("getTimeZoneForCountry maps known ISO codes to their IANA timezone", () => {
  assert.equal(getTimeZoneForCountry("DE"), "Europe/Berlin");
  assert.equal(getTimeZoneForCountry("AT"), "Europe/Vienna");
  assert.equal(getTimeZoneForCountry("CH"), "Europe/Zurich");
});

test("getTimeZoneForCountry is case-insensitive", () => {
  assert.equal(getTimeZoneForCountry("de"), "Europe/Berlin");
  assert.equal(getTimeZoneForCountry("Fr"), "Europe/Paris");
});

test("getTimeZoneForCountry falls back to Europe/Berlin for unknown or missing codes", () => {
  assert.equal(getTimeZoneForCountry("ZZ"), "Europe/Berlin");
  assert.equal(getTimeZoneForCountry(undefined), "Europe/Berlin");
  assert.equal(getTimeZoneForCountry(null), "Europe/Berlin");
});

test("formatArrivalTime renders 24h Berlin time correctly in summer (CEST, UTC+2)", () => {
  const summer = new Date("2026-08-30T14:05:00.000Z");
  assert.equal(formatArrivalTime(summer, getTimeZoneForCountry("DE")), "16:05");
});

test("formatArrivalTime renders 24h Berlin time correctly in winter (CET, UTC+1) — DST handled automatically", () => {
  const winter = new Date("2026-01-15T14:05:00.000Z");
  assert.equal(formatArrivalTime(winter, getTimeZoneForCountry("DE")), "15:05");
});

test("formatArrivalTime uses the given timezone, not a hardcoded one", () => {
  const instant = new Date("2026-06-01T12:00:00.000Z");
  // Poland (CEST) and Denmark (CEST) share Berlin's offset in summer, so use
  // a genuinely different zone to prove the parameter is actually respected.
  assert.equal(formatArrivalTime(instant, "UTC"), "12:00");
  assert.equal(formatArrivalTime(instant, "Europe/Berlin"), "14:00");
});
