import test from "node:test";
import assert from "node:assert/strict";

import { insertMarkersAfterAnchor, reorderMarkersLast } from "@/src/features/route/services/routeLiveReorderService";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";

function marker(id: string): MapCustomerMarker {
  return {
    id,
    title: id,
    description: "",
    phone: "",
    note: "",
    latitude: 0,
    longitude: 0,
    numberLabel: "1",
    openOrderCount: 1,
    country: "DE",
    city: "Berlin",
    region: "",
  };
}

test("moves the chosen marker to the end, keeping the others' relative order", () => {
  const markers = [marker("a"), marker("b"), marker("c"), marker("d")];
  const reordered = reorderMarkersLast(markers, "b");
  assert.deepEqual(reordered.map((value) => value.id), ["a", "c", "d", "b"]);
});

test("a null lastStopId returns the original array (order unchanged)", () => {
  const markers = [marker("a"), marker("b")];
  assert.equal(reorderMarkersLast(markers, null), markers);
});

test("an unknown id returns the original array untouched", () => {
  const markers = [marker("a"), marker("b")];
  const reordered = reorderMarkersLast(markers, "ghost");
  assert.deepEqual(reordered.map((value) => value.id), ["a", "b"]);
});

test("choosing the already-last marker is a no-op in effect", () => {
  const markers = [marker("a"), marker("b"), marker("c")];
  const reordered = reorderMarkersLast(markers, "c");
  assert.deepEqual(reordered.map((value) => value.id), ["a", "b", "c"]);
});

test("choosing the first marker moves it to the end, promoting the second to first", () => {
  const markers = [marker("a"), marker("b"), marker("c")];
  const reordered = reorderMarkersLast(markers, "a");
  assert.deepEqual(reordered.map((value) => value.id), ["b", "c", "a"]);
});

function markerAt(id: string, longitude: number): MapCustomerMarker {
  return { ...marker(id), longitude };
}

test("insertMarkersAfterAnchor puts a new stop where it adds the least detour, after the anchor", () => {
  const route = [markerAt("a", 0), markerAt("b", 1), markerAt("c", 2), markerAt("d", 3)];
  const result = insertMarkersAfterAnchor(route, [markerAt("n", 2.5)], "b");
  assert.deepEqual(result.map((value) => value.id), ["a", "b", "c", "n", "d"]);
});

test("insertMarkersAfterAnchor never inserts before or at the anchor, even if that would be shorter", () => {
  const route = [markerAt("a", 0), markerAt("b", 1), markerAt("c", 5)];
  const result = insertMarkersAfterAnchor(route, [markerAt("n", 0.5)], "b");
  assert.deepEqual(result.map((value) => value.id), ["a", "b", "n", "c"]);
});

test("insertMarkersAfterAnchor appends when there is no anchor, and skips ids already in the route", () => {
  const route = [markerAt("a", 0), markerAt("b", 1)];
  const result = insertMarkersAfterAnchor(route, [markerAt("a", 0), markerAt("n", 0.5)], null);
  assert.deepEqual(result.map((value) => value.id), ["a", "b", "n"]);
});
