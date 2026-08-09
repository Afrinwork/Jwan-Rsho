import test from "node:test";
import assert from "node:assert/strict";

import { buildNewCustomerForOrder, buildOrderCreateData, buildOrderItemData } from "@/src/repositories/orderRepositoryData";

test("order create data keeps ownerId on the order", () => {
  const order = buildOrderCreateData({
    customerId: "customer_1",
    items: [{ productId: "p1", productNameSnapshot: "Labneh", quantity: 2, unit: "kg", sortOrder: 0 }],
  }, "uid_1", "customer_1");

  assert.equal(order.ownerId, "uid_1");
  assert.equal(order.customerId, "customer_1");
});

test("order create data never contains an undefined note (Firestore rejects undefined field values)", () => {
  const order = buildOrderCreateData({
    customerId: "customer_1",
    items: [{ productId: "p1", productNameSnapshot: "Labneh", quantity: 2, unit: "kg", sortOrder: 0 }],
  }, "uid_1", "customer_1");

  assert.equal("note" in order, false);
});

test("customer record stays independent from the order record", () => {
  const customer = buildNewCustomerForOrder({
    fullName: "Sara",
    phone: "555",
    address: "River 8, 50667",
    city: "Koeln",
    country: "DE",
  }, "uid_2");

  assert.equal("customerId" in customer, false);
  assert.equal(customer.ownerId, "uid_2");
});

test("order items are shaped for the items subcollection", () => {
  const item = buildOrderItemData({
    id: "ignored",
    productId: "p1",
    productNameSnapshot: "Olives",
    quantity: 3,
    unit: "kg",
    sortOrder: 1,
  }, "item_1", "uid_1");

  assert.deepEqual(item, {
    id: "item_1",
    ownerId: "uid_1",
    productId: "p1",
    productNameSnapshot: "Olives",
    quantity: 3,
    unit: "kg",
    sortOrder: 1,
  });
});
