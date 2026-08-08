import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { assertFails, assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

import { createTestEnv } from "./testEnv";

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await createTestEnv("demo-rsho-rules-2");
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

test("User A can create a customer and an order under their own account", async () => {
  const userA = testEnv.authenticatedContext("userA");
  await assertSucceeds(setDoc(doc(userA.firestore(), "customers", "c1"), { ownerId: "userA", fullName: "Kunde A" }));
  await assertSucceeds(
    setDoc(doc(userA.firestore(), "orders", "o1"), { ownerId: "userA", customerId: "c1", status: "open" }),
  );
});

test("After User A logs out, User B cannot read or list User A's customers and orders", async () => {
  const userA = testEnv.authenticatedContext("userA");
  await setDoc(doc(userA.firestore(), "customers", "c1"), { ownerId: "userA", fullName: "Kunde A" });
  await setDoc(doc(userA.firestore(), "orders", "o1"), { ownerId: "userA", customerId: "c1", status: "open" });

  const userB = testEnv.authenticatedContext("userB");
  await assertFails(getDoc(doc(userB.firestore(), "customers", "c1")));
  await assertFails(getDoc(doc(userB.firestore(), "orders", "o1")));

  await assertFails(
    getDocs(query(collection(userB.firestore(), "customers"), where("ownerId", "==", "userA"))),
  );
});

test("User B cannot modify or remove User A's customer", async () => {
  const userA = testEnv.authenticatedContext("userA");
  await setDoc(doc(userA.firestore(), "customers", "c1"), { ownerId: "userA", fullName: "Kunde A" });

  const userB = testEnv.authenticatedContext("userB");
  await assertFails(setDoc(doc(userB.firestore(), "customers", "c1"), { ownerId: "userA", fullName: "Uebernommen" }));
});

test("Switching back to User A: their customers and orders are still there and unchanged", async () => {
  const userA = testEnv.authenticatedContext("userA");
  await setDoc(doc(userA.firestore(), "customers", "c1"), { ownerId: "userA", fullName: "Kunde A" });
  await setDoc(doc(userA.firestore(), "orders", "o1"), { ownerId: "userA", customerId: "c1", status: "open" });

  const userB = testEnv.authenticatedContext("userB");
  await assertFails(getDoc(doc(userB.firestore(), "customers", "c1")));

  const userAAgain = testEnv.authenticatedContext("userA");
  const customerSnapshot = await getDoc(doc(userAAgain.firestore(), "customers", "c1"));
  const orderSnapshot = await getDoc(doc(userAAgain.firestore(), "orders", "o1"));

  assert.equal(customerSnapshot.exists(), true);
  assert.equal(customerSnapshot.data()?.fullName, "Kunde A");
  assert.equal(orderSnapshot.exists(), true);
  assert.equal(orderSnapshot.data()?.status, "open");
});

test("User B's own customers stay separate and never show up in User A's owner-scoped list", async () => {
  const userA = testEnv.authenticatedContext("userA");
  await setDoc(doc(userA.firestore(), "customers", "c1"), { ownerId: "userA", fullName: "Kunde A" });

  const userB = testEnv.authenticatedContext("userB");
  await setDoc(doc(userB.firestore(), "customers", "c2"), { ownerId: "userB", fullName: "Kunde B" });

  const customersVisibleToA = await getDocs(
    query(collection(userA.firestore(), "customers"), where("ownerId", "==", "userA")),
  );

  assert.equal(customersVisibleToA.size, 1);
  assert.equal(customersVisibleToA.docs[0].data().fullName, "Kunde A");
});
