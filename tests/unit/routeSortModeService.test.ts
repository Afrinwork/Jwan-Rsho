import test from "node:test";
import assert from "node:assert/strict";

import { presetRouteOrder } from "@/src/features/route/services/routeSortModeService";

const origin = { latitude: 52.37, longitude: 9.73, label: "Hannover" };
// Longitudes spread west->east from the origin; two cities.
const points = [
  { id: "berlin-far", latitude: 52.52, longitude: 13.6, city: "Berlin" },
  { id: "hannover-near", latitude: 52.37, longitude: 9.75, city: "Hannover" },
  { id: "berlin-near", latitude: 52.52, longitude: 13.3, city: "Berlin" },
  { id: "hannover-mid", latitude: 52.4, longitude: 9.9, city: " hannover " },
];

test("optimized leaves the order to the routing providers", () => {
  assert.equal(presetRouteOrder("optimized", origin, points), null);
});

test("nearest sorts by distance from the start, farthest the other way round", () => {
  assert.deepEqual(presetRouteOrder("nearest", origin, points)?.map((p) => p.id), ["hannover-near", "hannover-mid", "berlin-near", "berlin-far"]);
  assert.deepEqual(presetRouteOrder("farthest", origin, points)?.map((p) => p.id), ["berlin-far", "berlin-near", "hannover-mid", "hannover-near"]);
});

test("city groups stops city by city, nearest city first, short path inside a city", () => {
  assert.deepEqual(presetRouteOrder("city", origin, points)?.map((p) => p.id), ["hannover-near", "hannover-mid", "berlin-near", "berlin-far"]);
});

test("city keeps a city together even when another city's stop is geographically in between", () => {
  const mixed = [
    { id: "a1", latitude: 0, longitude: 1, city: "A" },
    { id: "b1", latitude: 0, longitude: 2, city: "B" },
    { id: "a2", latitude: 0, longitude: 3, city: "A" },
  ];
  assert.deepEqual(presetRouteOrder("city", { latitude: 0, longitude: 0, label: "" }, mixed)?.map((p) => p.id), ["a1", "a2", "b1"]);
});
