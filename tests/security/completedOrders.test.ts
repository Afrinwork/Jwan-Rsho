import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { createTestEnv } from "./testEnv";

// Mirrors orderRepository.buildCompletedTodayOrdersQuery()'s shape (equality
// on ownerId/status plus a completedAt range) without importing the app's
// repository layer, which reaches into the live Firebase app/auth singletons
// this emulator-backed Firestore instance is standing in for. `db` comes in
// as `unknown` and gets cast: the rules-unit-testing package's own .d.ts
// declares .firestore() as returning the compat `firebase.firestore.Firestore`
// type even though, per its own doc comment, the instance is meant for
// either the v9 modular or compat client API — that instance really does
// satisfy the modular `Firestore` shape at runtime, the .d.ts is just wrong.
function completedTodayQuery(db: unknown, ownerId: string, startIso: string, endIsoExclusive: string) {
  const firestore = db as Firestore;
  return query(
    collection(firestore, "orders"),
    where("ownerId", "==", ownerId),
    where("status", "==", "completed"),
    where("completedAt", ">=", startIso),
    where("completedAt", "<", endIsoExclusive),
  );
}

const TODAY_START = "2026-06-15T00:00:00.000Z";
const TODAY_END = "2026-06-16T00:00:00.000Z";
const TODAY_TIME = "2026-06-15T10:00:00.000Z";
const YESTERDAY_TIME = "2026-06-14T23:00:00.000Z";

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await createTestEnv("demo-rsho-completed-orders");
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

async function seedCustomer(ownerId: string, customerId: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "customers", customerId), {
      ownerId,
      fullName: "Anna Beispiel",
      phone: "+49123456",
      address: "Musterstrasse 1",
      city: "Berlin",
      normalizedCity: "berlin",
      country: "DE",
      isActive: true,
      createdAt: TODAY_TIME,
      updatedAt: TODAY_TIME,
    });
  });
}

async function seedOrder(
  ownerId: string,
  orderId: string,
  customerId: string,
  status: "open" | "completed",
  completedAt?: string,
) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "orders", orderId), {
      ownerId,
      customerId,
      status,
      orderedAt: TODAY_TIME,
      createdAt: TODAY_TIME,
      updatedAt: TODAY_TIME,
      ...(completedAt ? { completedAt } : {}),
    });
    await setDoc(doc(db, "orders", orderId, "items", "item1"), {
      ownerId,
      productId: "product1",
      productNameSnapshot: "Apples",
      quantity: 2,
      unit: "kg",
      sortOrder: 0,
    });
  });
}

test("a completed-today order is returned by the today-range query", async () => {
  await seedCustomer("userA", "customerA");
  await seedOrder("userA", "orderToday", "customerA", "completed", TODAY_TIME);

  const userA = testEnv.authenticatedContext("userA");
  const snapshot = await getDocs(completedTodayQuery(userA.firestore(), "userA", TODAY_START, TODAY_END));
  assert.deepEqual(snapshot.docs.map((value) => value.id), ["orderToday"]);
});

test("a completed-yesterday order is excluded by the today-range query", async () => {
  await seedCustomer("userA", "customerA");
  await seedOrder("userA", "orderYesterday", "customerA", "completed", YESTERDAY_TIME);

  const userA = testEnv.authenticatedContext("userA");
  const snapshot = await getDocs(completedTodayQuery(userA.firestore(), "userA", TODAY_START, TODAY_END));
  assert.deepEqual(snapshot.docs.map((value) => value.id), []);
});

test("an open order never matches the completed-today query", async () => {
  await seedCustomer("userA", "customerA");
  await seedOrder("userA", "orderOpen", "customerA", "open");

  const userA = testEnv.authenticatedContext("userA");
  const snapshot = await getDocs(completedTodayQuery(userA.firestore(), "userA", TODAY_START, TODAY_END));
  assert.deepEqual(snapshot.docs.map((value) => value.id), []);
});

test("completing an order (owner update) sets status and completedAt without deleting it", async () => {
  await seedCustomer("userA", "customerA");
  await seedOrder("userA", "orderToday", "customerA", "open");

  const userA = testEnv.authenticatedContext("userA");
  await updateDoc(doc(userA.firestore(), "orders", "orderToday"), {
    status: "completed",
    completedAt: TODAY_TIME,
    updatedAt: TODAY_TIME,
  });

  const snapshot = await getDoc(doc(userA.firestore(), "orders", "orderToday"));
  assert.equal(snapshot.exists(), true);
  assert.equal(snapshot.data()?.status, "completed");
  assert.equal(snapshot.data()?.completedAt, TODAY_TIME);
});

test("deleting a single completed order removes it and its items, but leaves the customer and an unrelated open order untouched", async () => {
  await seedCustomer("userA", "customerA");
  await seedOrder("userA", "orderToday", "customerA", "completed", TODAY_TIME);
  await seedOrder("userA", "orderOpen", "customerA", "open");

  const userA = testEnv.authenticatedContext("userA");
  const db = userA.firestore();
  const itemsSnapshot = await getDocs(collection(db, "orders", "orderToday", "items"));
  const batch = writeBatch(db);
  itemsSnapshot.docs.forEach((value) => batch.delete(value.ref));
  batch.delete(doc(db, "orders", "orderToday"));
  await batch.commit();

  const [deletedOrder, remainingCustomer, remainingOpenOrder] = await Promise.all([
    getDoc(doc(db, "orders", "orderToday")),
    getDoc(doc(db, "customers", "customerA")),
    getDoc(doc(db, "orders", "orderOpen")),
  ]);

  assert.equal(deletedOrder.exists(), false);
  assert.equal(remainingCustomer.exists(), true);
  assert.equal(remainingOpenOrder.exists(), true);
  assert.equal(remainingOpenOrder.data()?.status, "open");

  // Read via an admin context, not userA's: once the parent order is gone,
  // the items rule's get() on it can no longer resolve, so this can't be
  // verified through the same rule-scoped client that did the deleting.
  let remainingItemsCount = -1;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    remainingItemsCount = (await getDocs(collection(context.firestore(), "orders", "orderToday", "items"))).size;
  });
  assert.equal(remainingItemsCount, 0);
});

test("deleting every completed-today order (bulk delete) removes only those, leaving yesterday's completed order and the open order in place", async () => {
  await seedCustomer("userA", "customerA");
  await seedOrder("userA", "orderToday1", "customerA", "completed", TODAY_TIME);
  await seedOrder("userA", "orderToday2", "customerA", "completed", "2026-06-15T12:00:00.000Z");
  await seedOrder("userA", "orderYesterday", "customerA", "completed", YESTERDAY_TIME);
  await seedOrder("userA", "orderOpen", "customerA", "open");

  const userA = testEnv.authenticatedContext("userA");
  const db = userA.firestore();
  const todaySnapshot = await getDocs(completedTodayQuery(db, "userA", TODAY_START, TODAY_END));
  assert.equal(todaySnapshot.size, 2);

  for (const orderDoc of todaySnapshot.docs) {
    const itemsSnapshot = await getDocs(collection(db, "orders", orderDoc.id, "items"));
    const batch = writeBatch(db);
    itemsSnapshot.docs.forEach((value) => batch.delete(value.ref));
    batch.delete(orderDoc.ref);
    await batch.commit();
  }

  const [remainingToday, remainingYesterday, remainingOpen] = await Promise.all([
    getDocs(completedTodayQuery(db, "userA", TODAY_START, TODAY_END)),
    getDoc(doc(db, "orders", "orderYesterday")),
    getDoc(doc(db, "orders", "orderOpen")),
  ]);

  assert.equal(remainingToday.size, 0);
  assert.equal(remainingYesterday.exists(), true);
  assert.equal(remainingOpen.exists(), true);
});

test("a foreign user's completed-today query never returns another account's completed order", async () => {
  await seedCustomer("userA", "customerA");
  await seedOrder("userA", "orderToday", "customerA", "completed", TODAY_TIME);

  const userB = testEnv.authenticatedContext("userB");
  const snapshot = await getDocs(completedTodayQuery(userB.firestore(), "userB", TODAY_START, TODAY_END));
  assert.deepEqual(snapshot.docs.map((value) => value.id), []);
});

test("a foreign user cannot delete another account's completed order directly", async () => {
  await seedCustomer("userA", "customerA");
  await seedOrder("userA", "orderToday", "customerA", "completed", TODAY_TIME);

  const userB = testEnv.authenticatedContext("userB");
  await assert.rejects(deleteDoc(doc(userB.firestore(), "orders", "orderToday")));

  let stillExists = false;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    stillExists = (await getDoc(doc(context.firestore(), "orders", "orderToday"))).exists();
  });
  assert.equal(stillExists, true);
});
