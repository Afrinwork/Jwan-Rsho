import test from "node:test";
import assert from "node:assert/strict";

import { getLocalDayIsoRange, isSameLocalDay } from "@/src/utils/time/localDay";

// Fixed to a real IANA zone so the UTC-crossing cases below are meaningful
// regardless of which timezone the machine running these tests defaults to.
// Safe to set after the imports above: neither of them constructs a Date at
// module-load time, only inside the test bodies that run after this line.
process.env.TZ = "Europe/Berlin";

test("getLocalDayIsoRange returns local midnight to next local midnight", () => {
  const { startIso, endIsoExclusive } = getLocalDayIsoRange(new Date(2026, 5, 15, 14, 30));
  assert.equal(new Date(startIso).getTime(), new Date(2026, 5, 15, 0, 0, 0, 0).getTime());
  assert.equal(new Date(endIsoExclusive).getTime(), new Date(2026, 5, 16, 0, 0, 0, 0).getTime());
});

test("isSameLocalDay: a timestamp from earlier today matches", () => {
  const reference = new Date(2026, 5, 15, 18, 0);
  const completedAt = new Date(2026, 5, 15, 9, 15).toISOString();
  assert.equal(isSameLocalDay(completedAt, reference), true);
});

test("isSameLocalDay: a timestamp from yesterday does not match", () => {
  const reference = new Date(2026, 5, 15, 9, 0);
  const completedAt = new Date(2026, 5, 14, 23, 59).toISOString();
  assert.equal(isSameLocalDay(completedAt, reference), false);
});

test("isSameLocalDay: does not misfire across a UTC day boundary that isn't a local day boundary (CET, UTC+1)", () => {
  // 2026-01-15T23:30 local (Berlin, winter +1) is 2026-01-15T22:30 UTC — same
  // UTC calendar day as the reference below. A naive UTC-slice comparison
  // would agree here, so this alone doesn't prove local-time correctness,
  // but combined with the next test it pins down the boundary is local.
  const reference = new Date(2026, 0, 15, 12, 0);
  const completedAt = new Date(2026, 0, 15, 23, 30).toISOString();
  assert.equal(isSameLocalDay(completedAt, reference), true);
});

test("isSameLocalDay: a timestamp just after local midnight is 'today', even though its UTC calendar day is still 'yesterday' (CET, UTC+1)", () => {
  // 2026-01-16T00:30 local (Berlin, +1) is 2026-01-15T23:30 UTC. A day filter
  // built on `toISOString().slice(0, 10)` would file this under "2026-01-15"
  // (yesterday, UTC) and wrongly hide it from "today" (local) — exactly the
  // bug the task calls out.
  const reference = new Date(2026, 0, 16, 8, 0);
  const completedAt = new Date(2026, 0, 16, 0, 30).toISOString();
  assert.equal(new Date(completedAt).toISOString().slice(0, 10), "2026-01-15");
  assert.equal(isSameLocalDay(completedAt, reference), true);
});

test("getLocalDayIsoRange: a same-local-day timestamp falls inside the range", () => {
  const reference = new Date(2026, 0, 16, 8, 0);
  const completedAt = new Date(2026, 0, 16, 0, 30).toISOString();
  const { startIso, endIsoExclusive } = getLocalDayIsoRange(reference);
  assert.ok(completedAt >= startIso && completedAt < endIsoExclusive);
});

test("getLocalDayIsoRange: yesterday's timestamp falls outside the range", () => {
  const reference = new Date(2026, 0, 16, 8, 0);
  const completedAt = new Date(2026, 0, 15, 23, 59).toISOString();
  const { startIso, endIsoExclusive } = getLocalDayIsoRange(reference);
  assert.ok(!(completedAt >= startIso && completedAt < endIsoExclusive));
});
