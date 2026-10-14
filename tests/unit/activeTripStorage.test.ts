import test from "node:test";
import assert from "node:assert/strict";

import { ACTIVE_TRIP_MAX_AGE_MS, isResumableTrip, StoredActiveTrip } from "@/src/features/route/services/activeTripStorage.shared";

const now = Date.parse("2026-10-14T12:00:00Z");
const trip: StoredActiveTrip = {
  userId: "driver-1",
  orderedIds: ["a", "b"],
  handledIds: ["a"],
  skippedIds: [],
  savedAt: new Date(now - 60_000).toISOString(),
};

test("isResumableTrip resumes the same person's recent trip", () => {
  assert.equal(isResumableTrip(trip, "driver-1", now), true);
});

test("isResumableTrip ignores another account's, an empty or an overnight trip", () => {
  assert.equal(isResumableTrip(trip, "driver-2", now), false);
  assert.equal(isResumableTrip(trip, null, now), false);
  assert.equal(isResumableTrip(null, "driver-1", now), false);
  assert.equal(isResumableTrip({ ...trip, orderedIds: [] }, "driver-1", now), false);
  assert.equal(isResumableTrip({ ...trip, savedAt: new Date(now - ACTIVE_TRIP_MAX_AGE_MS - 1).toISOString() }, "driver-1", now), false);
});
