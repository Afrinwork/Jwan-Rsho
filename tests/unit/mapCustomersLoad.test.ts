import test from "node:test";
import assert from "node:assert/strict";

import { buildMapCustomerMarkers } from "@/src/features/map/services/mapCustomerService";

function makeCustomer(id: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id,
    ownerId: "u1",
    fullName: `Customer ${id}`,
    phone: "",
    address: "Street 1",
    city: "Berlin",
    normalizedCity: "berlin",
    country: "DE",
    region: "",
    latitude: 52.4,
    longitude: 13.3,
    isActive: true,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function makeOpenOrder(id: string, customerId: string) {
  return {
    id,
    ownerId: "u1",
    customerId,
    status: "open" as const,
    orderedAt: "",
    createdAt: "",
    updatedAt: "",
  };
}

test("no open orders produces no markers", () => {
  const markers = buildMapCustomerMarkers([], []);
  assert.equal(markers.length, 0);
});

test("100 open orders spread across 50 unique customers produce exactly 50 markers, one per customer", () => {
  const customers = Array.from({ length: 50 }, (_, index) => makeCustomer(`c${index + 1}`));
  // Two open orders per customer — mirrors a customer with more than one open order.
  const openOrders = customers.flatMap((customer) => [
    makeOpenOrder(`${customer.id}-o1`, customer.id),
    makeOpenOrder(`${customer.id}-o2`, customer.id),
  ]);

  const markers = buildMapCustomerMarkers(customers, openOrders);

  assert.equal(openOrders.length, 100);
  assert.equal(markers.length, 50);
  assert.equal(new Set(markers.map((marker) => marker.id)).size, 50);
  markers.forEach((marker) => assert.equal(marker.openOrderCount, 2));
});

test("a customer referenced by an open order but missing from the fetched customer list is silently skipped, not an error", () => {
  const openOrders = [makeOpenOrder("o1", "ghost-customer")];
  const markers = buildMapCustomerMarkers([], openOrders);
  assert.equal(markers.length, 0);
});
