import test from "node:test";
import assert from "node:assert/strict";

import { getBerlinDateKey, isPastMorningWindow, isWithinMorningWindow } from "@/src/utils/time/europeBerlin";

test("getBerlinDateKey formats a plain instant as YYYY-MM-DD Berlin calendar day", () => {
  assert.equal(getBerlinDateKey(new Date("2026-06-15T10:00:00.000Z")), "2026-06-15");
});

test("getBerlinDateKey rolls over past UTC midnight once it's already the next day in Berlin (CET, UTC+1)", () => {
  // 2026-01-15T23:30 UTC is already 2026-01-16T00:30 in Berlin (winter, +1)
  assert.equal(getBerlinDateKey(new Date("2026-01-15T23:30:00.000Z")), "2026-01-16");
});

test("isWithinMorningWindow: within window on a normal winter day (CET, UTC+1)", () => {
  // 07:00 Berlin winter = 06:00 UTC
  assert.equal(isWithinMorningWindow(new Date("2026-01-15T06:00:00.000Z")), true);
  assert.equal(isPastMorningWindow(new Date("2026-01-15T06:00:00.000Z")), false);
});

test("isWithinMorningWindow: within window on a normal summer day (CEST, UTC+2)", () => {
  // 07:00 Berlin summer = 05:00 UTC
  assert.equal(isWithinMorningWindow(new Date("2026-08-30T05:00:00.000Z")), true);
  assert.equal(isPastMorningWindow(new Date("2026-08-30T05:00:00.000Z")), false);
});

test("isWithinMorningWindow: 06:00 Berlin is inclusive (start of window)", () => {
  // 06:00 Berlin winter = 05:00 UTC
  assert.equal(isWithinMorningWindow(new Date("2026-01-15T05:00:00.000Z")), true);
});

test("isWithinMorningWindow: before 06:00 Berlin is neither within nor past the window", () => {
  // 05:59 Berlin winter = 04:59 UTC
  const beforeWindow = new Date("2026-01-15T04:59:00.000Z");
  assert.equal(isWithinMorningWindow(beforeWindow), false);
  assert.equal(isPastMorningWindow(beforeWindow), false);
});

test("isWithinMorningWindow: 10:00 Berlin is exclusive (end of window) and counts as past", () => {
  // 10:00 Berlin winter = 09:00 UTC
  const atCutoff = new Date("2026-01-15T09:00:00.000Z");
  assert.equal(isWithinMorningWindow(atCutoff), false);
  assert.equal(isPastMorningWindow(atCutoff), true);
});

test("isWithinMorningWindow: 09:59 Berlin is still within the window", () => {
  // 09:59 Berlin winter = 08:59 UTC
  assert.equal(isWithinMorningWindow(new Date("2026-01-15T08:59:00.000Z")), true);
  assert.equal(isPastMorningWindow(new Date("2026-01-15T08:59:00.000Z")), false);
});

test("morning window boundaries stay correct on the spring-forward DST day (2026-03-29, Berlin switches CET->CEST at 03:00)", () => {
  // The 06:00-10:00 Berlin window falls entirely after the 03:00 CET->CEST
  // jump, so this day is already CEST (+2) throughout the window.
  const start = new Date("2026-03-29T04:00:00.000Z"); // 06:00 CEST
  const end = new Date("2026-03-29T08:00:00.000Z"); // 10:00 CEST
  assert.equal(isWithinMorningWindow(start), true);
  assert.equal(isWithinMorningWindow(end), false);
  assert.equal(isPastMorningWindow(end), true);
});

test("morning window boundaries stay correct on the fall-back DST day (2026-10-25, Berlin switches CEST->CET at 03:00)", () => {
  // The 06:00-10:00 Berlin window falls entirely after the 03:00 CEST->CET
  // fallback, so this day is already CET (+1) throughout the window.
  const start = new Date("2026-10-25T05:00:00.000Z"); // 06:00 CET
  const end = new Date("2026-10-25T09:00:00.000Z"); // 10:00 CET
  assert.equal(isWithinMorningWindow(start), true);
  assert.equal(isWithinMorningWindow(end), false);
  assert.equal(isPastMorningWindow(end), true);
});
