import test from "node:test";
import assert from "node:assert/strict";

import { routeDistance } from "@/src/features/route/services/routeDistanceMatrixService";
import { presetRouteOrder } from "@/src/features/route/services/routeSortModeService";
import { optimizedRemainingOrder } from "@/src/features/route/services/routeVariantService";

const origin = { latitude: 0, longitude: 0, label: "" };
// "acrossRiver" is closest as the crow flies, but a long drive away.
const acrossRiver = { id: "acrossRiver", latitude: 0, longitude: 0.01 };
const sameBank = { id: "sameBank", latitude: 0, longitude: -0.02 };
const points = [acrossRiver, sameBank];
// km, rows/columns: origin, acrossRiver, sameBank
const roadMatrix = [
  [0, 15, 2.5],
  [15, 0, 16],
  [2.5, 16, 0],
];

test("routeDistance uses the road matrix and falls back to the straight line", () => {
  const distance = routeDistance(origin, points, roadMatrix);
  assert.equal(distance(origin, acrossRiver), 15);
  assert.ok(Math.abs(routeDistance(origin, points, null)(origin, acrossRiver) - 1.11) < 0.01);
  const gap = routeDistance(origin, points, [[0, Infinity, 2.5], [15, 0, 16], [2.5, 16, 0]]);
  assert.ok(gap(origin, acrossRiver) < 2, "unreachable pair falls back to the straight line");
});

test("nearest first follows real driving distance once the matrix is known", () => {
  assert.deepEqual(presetRouteOrder("nearest", origin, points)?.map((p) => p.id), ["acrossRiver", "sameBank"]);
  assert.deepEqual(presetRouteOrder("nearest", origin, points, 0, roadMatrix)?.map((p) => p.id), ["sameBank", "acrossRiver"]);
});

test("optimizedRemainingOrder untangles a crossing route", () => {
  const line = [3, 1, 4, 2].map((x) => ({ id: `s${x}`, latitude: 0, longitude: x }));
  assert.deepEqual(optimizedRemainingOrder(origin, line).map((p) => p.id), ["s1", "s2", "s3", "s4"]);
});
