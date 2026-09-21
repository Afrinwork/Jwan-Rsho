import test from "node:test";
import assert from "node:assert/strict";

import { buildCompletedTodayEntries, filterCompletedTodayEntries } from "@/src/features/overview/services/completedTodayService";
import { Customer } from "@/src/types/customer";
import { OrderWithItems } from "@/src/types/order";

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "customer-1",
    ownerId: "owner-1",
    fullName: "Anna Beispiel",
    phone: "+49123456",
    address: "Musterstrasse 1",
    city: "Berlin",
    normalizedCity: "berlin",
    country: "DE",
    isActive: true,
    createdAt: "2026-06-15T08:00:00.000Z",
    updatedAt: "2026-06-15T08:00:00.000Z",
    ...overrides,
  };
}

function makeOrder(overrides: Partial<OrderWithItems> = {}): OrderWithItems {
  return {
    id: "order-1",
    ownerId: "owner-1",
    customerId: "customer-1",
    status: "completed",
    orderedAt: "2026-06-15T08:00:00.000Z",
    completedAt: "2026-06-15T09:30:00.000Z",
    createdAt: "2026-06-15T08:00:00.000Z",
    updatedAt: "2026-06-15T09:30:00.000Z",
    items: [
      { id: "item-1", productId: "p1", productNameSnapshot: "Apples", quantity: 2, unit: "kg", sortOrder: 0 },
      { id: "item-2", productId: "p2", productNameSnapshot: "Bread", quantity: 1, unit: "pc", sortOrder: 1 },
    ],
    ...overrides,
  };
}

test("buildCompletedTodayEntries joins order + customer data and counts items", () => {
  const entries = buildCompletedTodayEntries([makeOrder()], [makeCustomer()]);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].customerName, "Anna Beispiel");
  assert.equal(entries[0].city, "Berlin");
  assert.equal(entries[0].itemCount, 2);
  assert.equal(entries[0].completedAt, "2026-06-15T09:30:00.000Z");
});

test("buildCompletedTodayEntries skips orders whose customer no longer exists", () => {
  const entries = buildCompletedTodayEntries([makeOrder({ customerId: "missing" })], [makeCustomer()]);
  assert.equal(entries.length, 0);
});

test("buildCompletedTodayEntries skips orders without a completedAt (defensive against unmarked history)", () => {
  const entries = buildCompletedTodayEntries([makeOrder({ completedAt: undefined })], [makeCustomer()]);
  assert.equal(entries.length, 0);
});

test("buildCompletedTodayEntries sorts most recently completed first", () => {
  const earlier = makeOrder({ id: "order-earlier", completedAt: "2026-06-15T08:00:00.000Z" });
  const later = makeOrder({ id: "order-later", completedAt: "2026-06-15T11:00:00.000Z" });
  const entries = buildCompletedTodayEntries([earlier, later], [makeCustomer()]);
  assert.deepEqual(entries.map((value) => value.orderId), ["order-later", "order-earlier"]);
});

test("filterCompletedTodayEntries matches by customer name, case-insensitively", () => {
  const entries = buildCompletedTodayEntries(
    [makeOrder({ id: "order-1", customerId: "c1" }), makeOrder({ id: "order-2", customerId: "c2" })],
    [makeCustomer({ id: "c1", fullName: "Anna Beispiel" }), makeCustomer({ id: "c2", fullName: "Max Muster" })],
  );

  assert.deepEqual(filterCompletedTodayEntries(entries, "anna").map((value) => value.customerId), ["c1"]);
  assert.deepEqual(filterCompletedTodayEntries(entries, "MUSTER").map((value) => value.customerId), ["c2"]);
});

test("filterCompletedTodayEntries returns everything for a blank search term", () => {
  const entries = buildCompletedTodayEntries([makeOrder()], [makeCustomer()]);
  assert.equal(filterCompletedTodayEntries(entries, "   ").length, 1);
});

test("filterCompletedTodayEntries returns nothing when no name matches", () => {
  const entries = buildCompletedTodayEntries([makeOrder()], [makeCustomer()]);
  assert.equal(filterCompletedTodayEntries(entries, "nonexistent").length, 0);
});
