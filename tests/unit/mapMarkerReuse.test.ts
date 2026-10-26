import test from "node:test";
import assert from "node:assert/strict";

import { reuseUnchangedMarkers } from "@/src/features/map/services/mapCustomerService";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";

function marker(id: string, extra: Partial<MapCustomerMarker> = {}): MapCustomerMarker {
  return {
    id,
    title: id,
    description: "",
    phone: "",
    note: "",
    latitude: 52,
    longitude: 13,
    numberLabel: "1",
    openOrderCount: 1,
    country: "DE",
    city: "Berlin",
    region: "",
    ...extra,
  };
}

test("an identical reload keeps the very same list", () => {
  const previous = [marker("a"), marker("b")];
  const next = [marker("a"), marker("b")];
  assert.equal(reuseUnchangedMarkers(previous, next), previous);
});

test("only the changed marker is a new object", () => {
  const previous = [marker("a"), marker("b")];
  const result = reuseUnchangedMarkers(previous, [marker("a"), marker("b", { openOrderCount: 2 })]);
  assert.notEqual(result, previous);
  assert.equal(result[0], previous[0]);
  assert.equal(result[1].openOrderCount, 2);
});

test("added, removed and reordered markers produce a new list", () => {
  const previous = [marker("a"), marker("b")];
  assert.equal(reuseUnchangedMarkers(previous, [marker("a")]).length, 1);
  assert.equal(reuseUnchangedMarkers(previous, [marker("a"), marker("b"), marker("c")]).length, 3);
  const reordered = reuseUnchangedMarkers(previous, [marker("b"), marker("a")]);
  assert.notEqual(reordered, previous);
  assert.equal(reordered[0], previous[1]);
});

test("an optional field appearing counts as a change", () => {
  const previous = [marker("a")];
  const result = reuseUnchangedMarkers(previous, [marker("a", { hiddenFromDriver: true })]);
  assert.notEqual(result[0], previous[0]);
});
