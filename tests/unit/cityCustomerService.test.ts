import test from "node:test";
import assert from "node:assert/strict";

import { buildCityCustomerItems, filterCityCustomerItems } from "@/src/features/cities/services/cityCustomerService";

test("city customer items expose current open order and status", () => {
  const items = buildCityCustomerItems([
    { id: "c1", ownerId: "u1", fullName: "Ahmad", phone: "123", street: "Main", houseNumber: "1", postalCode: "1", city: "Hamburg", normalizedCity: "hamburg", country: "DE", isActive: true, createdAt: "", updatedAt: "" },
    { id: "c2", ownerId: "u1", fullName: "Sara", phone: "456", street: "River", houseNumber: "2", postalCode: "2", city: "Hamburg", normalizedCity: "hamburg", country: "DE", isActive: true, createdAt: "", updatedAt: "" },
  ], [
    { id: "o1", ownerId: "u1", customerId: "c1", status: "open", orderedAt: "2026-08-08T10:00:00.000Z", createdAt: "", updatedAt: "" },
    { id: "o2", ownerId: "u1", customerId: "c2", status: "completed", orderedAt: "2026-08-07T10:00:00.000Z", createdAt: "", updatedAt: "" },
  ]);

  assert.equal(items[0]?.currentOpenOrderId, "o1");
  assert.equal(items[0]?.status, "open");
  assert.equal(items[1]?.currentOpenOrderId, null);
  assert.equal(items[1]?.status, "completed");
});

test("city customer filters search and status correctly", () => {
  const items = [
    { id: "c1", fullName: "Ahmad", phone: "123", street: "Main", houseNumber: "1", postalCode: "1", city: "Hamburg", currentOpenOrderId: "o1", currentOpenOrderLabel: "Offen seit 8/8/2026", status: "open" as const },
    { id: "c2", fullName: "Sara", phone: "456", street: "River", houseNumber: "2", postalCode: "2", city: "Hamburg", currentOpenOrderId: null, currentOpenOrderLabel: null, status: "no-open-order" as const },
  ];

  assert.equal(filterCityCustomerItems(items, "Ahm", "all").length, 1);
  assert.equal(filterCityCustomerItems(items, "", "open").length, 1);
  assert.equal(filterCityCustomerItems(items, "", "no-open-order").length, 1);
});
