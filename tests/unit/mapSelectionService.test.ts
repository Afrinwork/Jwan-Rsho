import test from "node:test";
import assert from "node:assert/strict";

import { mapSelectionService } from "@/src/features/map/services/mapSelectionService";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";

function marker(overrides: Partial<MapCustomerMarker>): MapCustomerMarker {
  return {
    id: "c1",
    title: "Name",
    description: "Address",
    phone: "111",
    note: "",
    latitude: 0,
    longitude: 0,
    numberLabel: "1",
    openOrderCount: 1,
    country: "DE",
    city: "Berlin",
    region: "",
    ...overrides,
  };
}

test("toggle selection adds and removes a marker id", () => {
  const selected = mapSelectionService.toggleMarkerSelection([], "c1");
  assert.deepEqual(selected, ["c1"]);
  assert.deepEqual(mapSelectionService.toggleMarkerSelection(selected, "c1"), []);
});

test("reset selection always returns an empty array", () => {
  assert.deepEqual(mapSelectionService.resetSelection(), []);
});

test("merge selection unions ids without duplicates", () => {
  assert.deepEqual(mapSelectionService.mergeSelection(["c1"], ["c1", "c2"]), ["c1", "c2"]);
});

test("circle selection only returns markers inside the radius", () => {
  const markers = [
    marker({ id: "inside", latitude: 0, longitude: 0 }),
    marker({ id: "outside", latitude: 30, longitude: 30 }),
  ];

  const ids = mapSelectionService.getMarkerIdsInCircle(markers, { latitude: 0, longitude: 0, radiusKm: 5 });
  assert.deepEqual(ids, ["inside"]);
});

test("polygon selection only returns markers inside the shape", () => {
  const markers = [
    marker({ id: "inside", latitude: 5, longitude: 5 }),
    marker({ id: "outside", latitude: 50, longitude: 50 }),
  ];

  const polygon = [
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 10 },
    { latitude: 10, longitude: 10 },
    { latitude: 10, longitude: 0 },
  ];

  assert.deepEqual(mapSelectionService.getMarkerIdsInPolygon(markers, polygon), ["inside"]);
});

test("empty marker list never crashes and returns no ids", () => {
  assert.deepEqual(mapSelectionService.getMarkerIdsInCircle([], { latitude: 0, longitude: 0, radiusKm: 1 }), []);
  assert.deepEqual(mapSelectionService.getMarkerIdsInPolygon([], []), []);
});

test("polygon drawing skips points that are too close together", () => {
  assert.equal(
    mapSelectionService.shouldAppendPolygonPoint([{ latitude: 52.52, longitude: 13.405 }], { latitude: 52.5201, longitude: 13.4051 }),
    false,
  );
  assert.equal(
    mapSelectionService.shouldAppendPolygonPoint([{ latitude: 52.52, longitude: 13.405 }], { latitude: 52.521, longitude: 13.406 }),
    true,
  );
});
