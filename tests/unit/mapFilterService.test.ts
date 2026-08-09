import test from "node:test";
import assert from "node:assert/strict";

import {
  filterMapMarkers,
  getMapCityOptions,
  getMapCountryOptions,
  getMapRegionOptions,
} from "@/src/features/map/services/mapFilterService";

const markers = [
  {
    id: "c1",
    title: "A",
    description: "Berlin",
    phone: "1",
    note: "",
    latitude: 1,
    longitude: 1,
    numberLabel: "1",
    openOrderCount: 1,
    country: "DE",
    city: "Berlin",
    region: "BE",
  },
  {
    id: "c2",
    title: "B",
    description: "Hamburg",
    phone: "2",
    note: "",
    latitude: 2,
    longitude: 2,
    numberLabel: "2",
    openOrderCount: 1,
    country: "DE",
    city: "Hamburg",
    region: "",
  },
  {
    id: "c3",
    title: "C",
    description: "Paris",
    phone: "3",
    note: "",
    latitude: 3,
    longitude: 3,
    numberLabel: "3",
    openOrderCount: 1,
    country: "FR",
    city: "Paris",
    region: "IDF",
  },
];

test("map filters return only matching country city and region markers", () => {
  const filtered = filterMapMarkers(markers, { country: "DE", city: "Berlin", region: "BE" });
  assert.deepEqual(filtered.map((value) => value.id), ["c1"]);
});

test("map filter options expose only values that exist", () => {
  assert.deepEqual(getMapCountryOptions(markers), ["DE", "FR"]);
  assert.deepEqual(getMapCityOptions(markers, { country: "DE", city: "", region: "" }), ["Berlin", "Hamburg"]);
  assert.deepEqual(getMapRegionOptions(markers, { country: "FR", city: "Paris", region: "" }), ["IDF"]);
});
