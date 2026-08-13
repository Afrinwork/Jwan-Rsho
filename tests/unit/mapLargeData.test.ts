import test from "node:test";
import assert from "node:assert/strict";

import { buildCitySummaries } from "@/src/features/cities/services/cityService";
import { filterMapMarkers } from "@/src/features/map/services/mapFilterService";
import { buildMapCustomerMarkers } from "@/src/features/map/services/mapCustomerService";
import { mapSelectionService } from "@/src/features/map/services/mapSelectionService";

test("large data: 500 customers build map markers and city summaries without crashes", () => {
  const customers = Array.from({ length: 500 }, (_, index) => ({
    id: `c${index + 1}`,
    ownerId: "u1",
    fullName: `Customer ${index + 1}`,
    phone: `100${index + 1}`,
    address: `Street ${index + 1}, 10${String(index).padStart(3, "0")}`,
    city: index % 2 === 0 ? "Berlin" : "Hamburg",
    normalizedCity: index % 2 === 0 ? "berlin" : "hamburg",
    country: "DE",
    region: index % 3 === 0 ? "Nord" : "Sued",
    latitude: 52.4 + index * 0.0001,
    longitude: 13.3 + index * 0.0001,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  }));
  const openOrders = customers.map((customer, index) => ({
    id: `o${index + 1}`,
    ownerId: "u1",
    customerId: customer.id,
    status: "open" as const,
    orderedAt: "",
    createdAt: "",
    updatedAt: "",
  }));

  const markers = buildMapCustomerMarkers(customers, openOrders);
  const summaries = buildCitySummaries([], customers, openOrders);
  const filtered = filterMapMarkers(markers, { country: "DE", city: "Berlin", region: "Nord" });

  assert.equal(markers.length, 500);
  assert.equal(summaries.length, 2);
  assert.ok(filtered.length > 0);
});

test("large data: selection services handle many markers and preserve stable counts", () => {
  const markers = Array.from({ length: 500 }, (_, index) => ({
    id: `c${index + 1}`,
    title: `Customer ${index + 1}`,
    description: `Address ${index + 1}`,
    phone: `100${index + 1}`,
    note: "",
    latitude: 52.5 + index * 0.0001,
    longitude: 13.4 + index * 0.0001,
    numberLabel: String(index + 1),
    openOrderCount: 1,
    country: "DE",
    city: index % 2 === 0 ? "Berlin" : "Hamburg",
    region: index % 3 === 0 ? "Nord" : "Sued",
  }));

  const circleIds = mapSelectionService.getMarkerIdsInCircle(markers, {
    latitude: 52.5,
    longitude: 13.4,
    radiusKm: 1,
  });
  const polygonIds = mapSelectionService.getMarkerIdsInPolygon(markers, [
    { latitude: 52.5, longitude: 13.4 },
    { latitude: 52.5, longitude: 13.45 },
    { latitude: 52.55, longitude: 13.45 },
    { latitude: 52.55, longitude: 13.4 },
  ]);

  assert.ok(circleIds.length > 0);
  assert.ok(polygonIds.length > 0);
  assert.equal(new Set(circleIds).size, circleIds.length);
  assert.equal(new Set(polygonIds).size, polygonIds.length);
});
