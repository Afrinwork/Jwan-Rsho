import test from "node:test";
import assert from "node:assert/strict";

import { splitCustomerOrders } from "@/src/features/customers/services/customerDetailsService";

test("customer details split open order and history orders", () => {
  const sections = splitCustomerOrders([
    { id: "o1", ownerId: "u1", customerId: "c1", status: "open", orderedAt: "", createdAt: "", updatedAt: "", items: [] },
    { id: "o2", ownerId: "u1", customerId: "c1", status: "completed", orderedAt: "", createdAt: "", updatedAt: "", items: [] },
  ]);

  assert.equal(sections.openOrders.length, 1);
  assert.equal(sections.historyOrders.length, 1);
  assert.equal(sections.historyOrders[0]?.status, "completed");
});
