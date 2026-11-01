import test from "node:test";
import assert from "node:assert/strict";

import { nextArrivedStopId } from "@/src/features/route/services/routeArrivalService";

test("arrival: asks within 120 m of the current stop", () => {
  assert.equal(nextArrivedStopId(null, "a", 0.1), "a");
  assert.equal(nextArrivedStopId(null, "a", 0.2), null);
});

test("arrival: GPS jitter between 120 m and 250 m keeps the question instead of toggling it", () => {
  assert.equal(nextArrivedStopId("a", "a", 0.13), "a");
  assert.equal(nextArrivedStopId("a", "a", 0.24), "a");
  assert.equal(nextArrivedStopId("a", "a", 0.26), null);
});

test("arrival: a new current stop or no position starts over", () => {
  assert.equal(nextArrivedStopId("a", "b", 0.2), null);
  assert.equal(nextArrivedStopId("a", "b", 0.05), "b");
  assert.equal(nextArrivedStopId("a", "a", null), null);
  assert.equal(nextArrivedStopId("a", null, 0.05), null);
});
