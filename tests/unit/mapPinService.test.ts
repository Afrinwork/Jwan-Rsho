import test from "node:test";
import assert from "node:assert/strict";

import { buildPinFeatureCollection, customerPin, routeStopPin } from "@/src/features/map/services/mapPinService";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";

function marker(id: string, extra: Partial<MapCustomerMarker> = {}) {
  return { id, latitude: 52, longitude: 13, numberLabel: id.toUpperCase(), hasStreetAddress: true, ...extra } as MapCustomerMarker;
}

test("customer pins use the same colors as CustomerMarker", () => {
  assert.equal(customerPin(marker("a"), false).color, "#16A34A");
  assert.equal(customerPin(marker("a", { hasStreetAddress: false }), false).color, "#EAB308");
  assert.equal(customerPin(marker("a"), true).color, "#111111");
  assert.equal(customerPin(marker("a"), false).label, "A");
});

test("route stop pins follow the stop state, selection overrides the color", () => {
  assert.equal(routeStopPin(marker("a"), "1", { active: true }).color, "#B42318");
  assert.equal(routeStopPin(marker("a"), "1", { active: false, inactive: true }).opacity, 0.6);
  assert.equal(routeStopPin(marker("a"), "1", { active: false, selected: true }).color, "#111111");
});

test("features are ordered so the active stop is drawn on top and completed ones at the bottom", () => {
  const pins = [
    routeStopPin(marker("active"), "1", { active: true }),
    routeStopPin(marker("open"), "2", { active: false }),
    routeStopPin(marker("done"), "3", { active: false, inactive: true }),
  ];
  const ids = buildPinFeatureCollection(pins).features.map((feature) => feature.properties?.id);
  assert.deepEqual(ids, ["done", "open", "active"]);
});

test("each feature carries what the native layer reads", () => {
  const [feature] = buildPinFeatureCollection([customerPin(marker("a", { latitude: 50, longitude: 8 }), false)]).features;
  assert.deepEqual(feature.geometry.coordinates, [8, 50]);
  assert.deepEqual(Object.keys(feature.properties ?? {}).sort(), ["borderColor", "color", "id", "label", "opacity", "scale"]);
});
