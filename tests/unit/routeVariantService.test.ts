import test from "node:test";
import assert from "node:assert/strict";

import { alternativeRouteOrder } from "@/src/features/route/services/routeVariantService";

const origin = { latitude: 52.52, longitude: 13.4, label: "" };
const points = Array.from({ length: 30 }, (_, index) => ({
  id: `c${index}`,
  latitude: 52.4 + ((index * 37) % 23) * 0.012,
  longitude: 13.2 + ((index * 53) % 29) * 0.015,
}));
const ids = (variant: { id: string }[]) => variant.map((point) => point.id).join(",");

test("alternativeRouteOrder keeps every stop exactly once", () => {
  const variant = alternativeRouteOrder(origin, points, 3);
  assert.equal(variant.length, points.length);
  assert.deepEqual(new Set(variant.map((point) => point.id)), new Set(points.map((point) => point.id)));
});

test("alternativeRouteOrder gives a different route on every tap", () => {
  const seen = new Set(Array.from({ length: 8 }, (_, index) => ids(alternativeRouteOrder(origin, points, index))));
  assert.equal(seen.size, 8);
});

test("alternativeRouteOrder is stable for the same variant number", () => {
  assert.equal(ids(alternativeRouteOrder(origin, points, 5)), ids(alternativeRouteOrder(origin, points, 5)));
});

test("alternativeRouteOrder still alternates with only two stops", () => {
  const two = points.slice(0, 2);
  assert.notEqual(ids(alternativeRouteOrder(origin, two, 0)), ids(alternativeRouteOrder(origin, two, 1)));
  assert.equal(ids(alternativeRouteOrder(origin, two, 0)), ids(alternativeRouteOrder(origin, two, 2)));
});
