import test from "node:test";
import assert from "node:assert/strict";

import { resetStopSelection, selectAllStopIds, toggleStopSelection } from "@/src/features/route/services/routeSelectionService";

function buildStop(id: string) {
  return {
    marker: { id, title: "T", description: "D", phone: "", note: "", latitude: 0, longitude: 0, numberLabel: "1", openOrderCount: 0, country: "", city: "", region: "" },
    orderIndex: 0,
    distanceFromPreviousKm: 0,
    cumulativeDistanceKm: 0,
    cumulativeEta: new Date(),
    isEstimated: false,
  };
}

test("single stop selection toggles on and off", () => {
  const selected = toggleStopSelection([], "s1");
  assert.deepEqual(selected, ["s1"]);
  assert.deepEqual(toggleStopSelection(selected, "s1"), []);
});

test("select all returns all stop ids", () => {
  const selected = selectAllStopIds([buildStop("s1"), buildStop("s2")]);
  assert.deepEqual(selected, ["s1", "s2"]);
  assert.deepEqual(resetStopSelection(), []);
});
