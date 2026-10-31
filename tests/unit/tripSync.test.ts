import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTIVE_TRIP_MAX_AGE_MS,
  chooseTripToResume,
  isOtherDevicesTripChange,
  StoredActiveTrip,
  SyncedActiveTrip,
} from "@/src/features/route/services/activeTripStorage.shared";

const now = Date.parse("2026-10-31T12:00:00Z");
const ago = (ms: number) => new Date(now - ms).toISOString();

const local: StoredActiveTrip = { userId: "admin-1", orderedIds: ["a", "b"], handledIds: [], skippedIds: [], savedAt: ago(10 * 60_000) };
const synced: SyncedActiveTrip = {
  userId: "admin-1",
  orderedIds: ["a", "b", "c"],
  handledIds: ["a"],
  skippedIds: [],
  scopeIds: ["a", "b", "c"],
  started: true,
  savedAt: ago(60_000),
  deviceId: "phone-a",
};

test("chooseTripToResume: a second phone with nothing stored joins the running trip", () => {
  assert.deepEqual(chooseTripToResume(null, synced, "admin-1", now), { trip: synced, fromSync: true });
});

test("chooseTripToResume: the synced trip wins when it is newer than this phone's", () => {
  assert.equal(chooseTripToResume(local, synced, "admin-1", now).trip, synced);
});

test("chooseTripToResume: this phone's own trip wins when it is newer", () => {
  assert.deepEqual(chooseTripToResume({ ...local, savedAt: ago(1000) }, synced, "admin-1", now), {
    trip: { ...local, savedAt: ago(1000) },
    fromSync: false,
  });
});

test("chooseTripToResume: ignores another account's or yesterday's synced trip", () => {
  assert.equal(chooseTripToResume(null, { ...synced, userId: "admin-2" }, "admin-1", now).trip, null);
  assert.equal(chooseTripToResume(null, { ...synced, savedAt: ago(ACTIVE_TRIP_MAX_AGE_MS + 1) }, "admin-1", now).trip, null);
  assert.equal(chooseTripToResume(local, { ...synced, savedAt: ago(ACTIVE_TRIP_MAX_AGE_MS + 1) }, "admin-1", now).trip, local);
});

test("isOtherDevicesTripChange: follows another phone's change once", () => {
  assert.equal(isOtherDevicesTripChange(synced, "phone-b", null, "admin-1", now), true);
  assert.equal(isOtherDevicesTripChange(synced, "phone-b", synced.savedAt, "admin-1", now), false);
});

test("isOtherDevicesTripChange: follows an addition from the order form (written by the server)", () => {
  assert.equal(isOtherDevicesTripChange({ ...synced, deviceId: "server" }, "phone-a", null, "admin-1", now), true);
});

test("isOtherDevicesTripChange: ignores this phone's own write coming back", () => {
  assert.equal(isOtherDevicesTripChange(synced, "phone-a", null, "admin-1", now), false);
});

test("isOtherDevicesTripChange: ignores nothing synced, another account and yesterday's trip", () => {
  assert.equal(isOtherDevicesTripChange(null, "phone-b", null, "admin-1", now), false);
  assert.equal(isOtherDevicesTripChange(synced, "phone-b", null, "admin-2", now), false);
  assert.equal(isOtherDevicesTripChange({ ...synced, savedAt: ago(ACTIVE_TRIP_MAX_AGE_MS + 1) }, "phone-b", null, "admin-1", now), false);
});
