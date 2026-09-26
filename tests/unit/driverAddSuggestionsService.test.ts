import assert from "node:assert/strict";
import test from "node:test";

import { buildDriverAddSuggestions } from "../../src/features/orders/services/driverAddSuggestionsService";
import { Customer } from "../../src/types/customer";
import { Order } from "../../src/types/order";

function customer(id: string, latitude?: number, longitude?: number): Customer {
  return {
    id, ownerId: "owner", fullName: id, phone: "", address: "", city: "Berlin",
    normalizedCity: "berlin", country: "DE", latitude, longitude, isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function order(id: string, customerId: string): Order {
  return {
    id, ownerId: "owner", customerId, status: "open",
    orderedAt: "2026-01-01T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

test("driver add suggestions prioritize route orders and sort each group by distance", () => {
  const suggestions = buildDriverAddSuggestions(
    [customer("near", 52.52, 13.41), customer("route-far", 52.7, 13.4), customer("route-near", 52.53, 13.4)],
    [order("o1", "route-far"), order("o2", "route-near")],
    { latitude: 52.52, longitude: 13.4 },
  );

  assert.deepEqual(suggestions.map((value) => value.customer.id), ["route-near", "route-far", "near"]);
  assert.equal(suggestions[0].reason, "route");
  assert.equal(suggestions[2].reason, "nearby");
});

test("driver add suggestions are capped and work without location permission", () => {
  const suggestions = buildDriverAddSuggestions(
    Array.from({ length: 8 }, (_, index) => customer(`customer-${index}`)), [], null,
  );

  assert.equal(suggestions.length, 5);
  assert.ok(suggestions.every((value) => value.distanceKm === null));
});
