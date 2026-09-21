import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, collectionGroup, doc, getDoc, getDocs, query, runTransaction, setDoc, where } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { createTestEnv } from "./testEnv";

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await createTestEnv("demo-rsho-order-integrity");
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

// Mirrors orderRepository.createOrder()'s transaction shape (read the order
// doc first, throw if it already exists, otherwise write customer + order +
// one item) without importing the repository itself, which reaches into the
// live Firebase app/auth singletons this emulator-backed instance stands in
// for — same convention as the rest of this test suite.
// `db` comes in as `unknown` and gets cast: the rules-unit-testing package's
// own .d.ts declares .firestore() as returning the compat
// `firebase.firestore.Firestore` type even though the instance really does
// satisfy the modular `Firestore` shape at runtime (see completedOrders.test.ts
// for the same, already-diagnosed mismatch).
async function createOrderTransaction(dbHandle: unknown, ownerId: string, orderId: string, customerId: string) {
  const db = dbHandle as Firestore;
  return runTransaction(db, async (transaction) => {
    const orderRef = doc(db, "orders", orderId);
    const customerRef = doc(db, "customers", customerId);
    const existingOrder = await transaction.get(orderRef);

    if (existingOrder.exists()) {
      throw new Error("Order already exists.");
    }

    transaction.set(customerRef, {
      ownerId,
      fullName: "Idempotency Test",
      phone: "",
      address: "",
      city: "Berlin",
      normalizedCity: "berlin",
      country: "DE",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    transaction.set(orderRef, {
      ownerId,
      customerId,
      status: "open",
      requestId: orderId,
      orderedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const itemRef = doc(collection(orderRef, "items"));
    transaction.set(itemRef, {
      ownerId,
      productId: "product1",
      productNameSnapshot: "Apples",
      quantity: 1,
      unit: "kg",
      sortOrder: 0,
    });
  });
}

test("a stable, caller-supplied order id makes a concurrent double-submit idempotent: exactly one order and one customer are created, never two", async () => {
  const userA = testEnv.authenticatedContext("userA").firestore();
  const orderId = "stable-order-id";
  const customerId = "stable-customer-id";

  const results = await Promise.allSettled([
    createOrderTransaction(userA, "userA", orderId, customerId),
    createOrderTransaction(userA, "userA", orderId, customerId),
  ]);

  const fulfilled = results.filter((value) => value.status === "fulfilled");
  const rejected = results.filter((value) => value.status === "rejected");
  assert.equal(fulfilled.length, 1, "exactly one of the two concurrent saves should win");
  assert.equal(rejected.length, 1, "the other should be rejected as an idempotent duplicate");
  assert.match((rejected[0] as PromiseRejectedResult).reason.message, /Order already exists/);

  const ordersSnapshot = await getDocs(query(collection(userA, "orders"), where("ownerId", "==", "userA")));
  const customersSnapshot = await getDocs(query(collection(userA, "customers"), where("ownerId", "==", "userA")));
  assert.equal(ordersSnapshot.size, 1, "no duplicate order should exist");
  assert.equal(customersSnapshot.size, 1, "no duplicate customer should exist");
});

test("retrying the exact same save after it already succeeded (id reused) is a safe no-op, not a duplicate", async () => {
  const userA = testEnv.authenticatedContext("userA").firestore();
  const orderId = "retry-order-id";
  const customerId = "retry-customer-id";

  await createOrderTransaction(userA, "userA", orderId, customerId);
  await assert.rejects(createOrderTransaction(userA, "userA", orderId, customerId), /Order already exists/);

  const ordersSnapshot = await getDocs(query(collection(userA, "orders"), where("ownerId", "==", "userA")));
  assert.equal(ordersSnapshot.size, 1);
});

async function seedCustomerWithOpenOrder(ownerId: string, index: number) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const customerId = `customer-${index}`;
    await setDoc(doc(db, "customers", customerId), {
      ownerId,
      fullName: `Customer ${index}`,
      phone: "",
      address: "Main street",
      city: "Berlin",
      normalizedCity: "berlin",
      country: "DE",
      latitude: 52.5 + index * 0.001,
      longitude: 13.4,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await setDoc(doc(db, "orders", `order-${index}`), {
      ownerId,
      customerId,
      status: "open",
      orderedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
  });
}

// Mirrors customerRepository.getCustomers()'s exact query shape (equality on
// ownerId only, no limit()) — this is the query getCustomersByIds() and the
// map/open-orders screens ultimately depend on. Proves there is no hidden
// 30/50/100-record cap: every seeded customer comes back, regardless of
// count.
for (const customerCount of [35, 105]) {
  test(`getCustomers()'s query shape returns all ${customerCount} customers for an account that size — no silent 30/50/100 cap`, async () => {
    await Promise.all(Array.from({ length: customerCount }, (_, index) => seedCustomerWithOpenOrder("userA", index)));

    const userA = testEnv.authenticatedContext("userA").firestore();
    const customersSnapshot = await getDocs(query(collection(userA, "customers"), where("ownerId", "==", "userA")));
    const ordersSnapshot = await getDocs(query(collection(userA, "orders"), where("ownerId", "==", "userA"), where("status", "==", "open")));

    assert.equal(customersSnapshot.size, customerCount);
    assert.equal(ordersSnapshot.size, customerCount);
  });
}

test("a foreign account's customer query never returns another account's customers, even at scale (40 seeded)", async () => {
  await Promise.all(Array.from({ length: 40 }, (_, index) => seedCustomerWithOpenOrder("userA", index)));

  const userB = testEnv.authenticatedContext("userB").firestore();
  const customersSnapshot = await getDocs(query(collection(userB, "customers"), where("ownerId", "==", "userB")));
  assert.equal(customersSnapshot.size, 0);
});

test("the diagnostic's collectionGroup items scan (ownerId-filtered) finds items across different orders", async () => {
  await createOrderTransaction(testEnv.authenticatedContext("userA").firestore(), "userA", "order-with-items-1", "customer-1");
  await createOrderTransaction(testEnv.authenticatedContext("userA").firestore(), "userA", "order-with-items-2", "customer-2");

  const userA = testEnv.authenticatedContext("userA").firestore();
  const itemsSnapshot = await getDocs(query(collectionGroup(userA, "items"), where("ownerId", "==", "userA")));
  assert.equal(itemsSnapshot.size, 2);
});

test("the diagnostic's collectionGroup items scan never returns another account's items", async () => {
  await createOrderTransaction(testEnv.authenticatedContext("userA").firestore(), "userA", "order-a", "customer-a");
  await createOrderTransaction(testEnv.authenticatedContext("userB").firestore(), "userB", "order-b", "customer-b");

  const userA = testEnv.authenticatedContext("userA").firestore();
  const itemsSnapshot = await getDocs(query(collectionGroup(userA, "items"), where("ownerId", "==", "userA")));
  assert.equal(itemsSnapshot.size, 1);
});

test("productRepository.getProductUsageCount's query shape (ownerId + productId on the items collectionGroup) is authorized and counts correctly", async () => {
  const userA = testEnv.authenticatedContext("userA").firestore();
  await createOrderTransaction(userA, "userA", "order-usage-1", "customer-usage-1");
  await createOrderTransaction(userA, "userA", "order-usage-2", "customer-usage-2");

  // Both seeded orders' single item uses productId "product1" (see
  // createOrderTransaction) — this reproduces exactly the query
  // productRepository.getProductUsageCount runs before deleting a product,
  // which had no valid security rule at all before this fix (every product
  // deletion failed with "No matching allow statements").
  const usageSnapshot = await getDocs(
    query(collectionGroup(userA, "items"), where("ownerId", "==", "userA"), where("productId", "==", "product1")),
  );
  assert.equal(usageSnapshot.size, 2);
});

test("creating an order tagged with someone else's ownerId is rejected outright (fails safely, doesn't half-save)", async () => {
  const userA = testEnv.authenticatedContext("userA").firestore();
  await assert.rejects(
    setDoc(doc(userA, "orders", "forged-order"), {
      ownerId: "userB",
      customerId: "customer-x",
      status: "open",
      orderedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }),
  );

  let stillMissing = false;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    stillMissing = !(await getDoc(doc(context.firestore(), "orders", "forged-order"))).exists();
  });
  assert.equal(stillMissing, true);
});
