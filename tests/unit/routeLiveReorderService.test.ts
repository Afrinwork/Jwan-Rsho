import test from "node:test";
import assert from "node:assert/strict";

import { reorderMarkersLast } from "@/src/features/route/services/routeLiveReorderService";
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
