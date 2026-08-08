import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { assertFails, assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";

import { createTestEnv } from "./testEnv";

const ownerScopedCollections = ["customers", "orders", "products", "countries", "regions"];

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await createTestEnv("demo-rsho-rules-1");
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

async function seedOwnerDoc(collectionName: string, docId: string, ownerId: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), collectionName, docId), { ownerId, name: "Seed" });
  });
}

async function seedUserProfile(uid: string, role: "user" | "admin") {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", uid), { role, fullName: uid, isActive: true });
  });
}

for (const collectionName of ownerScopedCollections) {
  test(`${collectionName}: owner can read their own document`, async () => {
    await seedOwnerDoc(collectionName, "doc1", "userA");
    const userA = testEnv.authenticatedContext("userA");
    await assertSucceeds(getDoc(doc(userA.firestore(), collectionName, "doc1")));
  });

  test(`${collectionName}: foreign user cannot read another user's document`, async () => {
    await seedOwnerDoc(collectionName, "doc1", "userA");
    const userB = testEnv.authenticatedContext("userB");
    await assertFails(getDoc(doc(userB.firestore(), collectionName, "doc1")));
  });

  test(`${collectionName}: foreign user cannot update another user's document`, async () => {
    await seedOwnerDoc(collectionName, "doc1", "userA");
    const userB = testEnv.authenticatedContext("userB");
    await assertFails(updateDoc(doc(userB.firestore(), collectionName, "doc1"), { name: "Hacked" }));
  });

  test(`${collectionName}: foreign user cannot delete another user's document`, async () => {
    await seedOwnerDoc(collectionName, "doc1", "userA");
    const userB = testEnv.authenticatedContext("userB");
    await assertFails(deleteDoc(doc(userB.firestore(), collectionName, "doc1")));
  });

  test(`${collectionName}: cannot create a document tagged with someone else's ownerId`, async () => {
    const userA = testEnv.authenticatedContext("userA");
    await assertFails(setDoc(doc(userA.firestore(), collectionName, "doc2"), { ownerId: "userB", name: "Fake" }));
  });

  test(`${collectionName}: owner cannot change ownerId on update`, async () => {
    await seedOwnerDoc(collectionName, "doc1", "userA");
    const userA = testEnv.authenticatedContext("userA");
    await assertFails(updateDoc(doc(userA.firestore(), collectionName, "doc1"), { ownerId: "userB" }));
  });

  test(`${collectionName}: unauthenticated access is blocked for read and write`, async () => {
    await seedOwnerDoc(collectionName, "doc1", "userA");
    const anon = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(anon.firestore(), collectionName, "doc1")));
    await assertFails(setDoc(doc(anon.firestore(), collectionName, "doc2"), { ownerId: "userA" }));
  });

  test(`${collectionName}: an admin's own role grants no extra Firestore access to other owners' data`, async () => {
    await seedOwnerDoc(collectionName, "doc1", "userA");
    await seedUserProfile("adminUser", "admin");
    const admin = testEnv.authenticatedContext("adminUser");
    await assertFails(getDoc(doc(admin.firestore(), collectionName, "doc1")));
  });
}

test("orders/items: owner can read their order's items", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "orders", "order1"), { ownerId: "userA", status: "open" });
    await setDoc(doc(context.firestore(), "orders", "order1", "items", "item1"), { productId: "p1", quantity: 1 });
  });

  const userA = testEnv.authenticatedContext("userA");
  await assertSucceeds(getDoc(doc(userA.firestore(), "orders", "order1", "items", "item1")));
});

test("orders/items: foreign user cannot read or write another user's order items", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "orders", "order1"), { ownerId: "userA", status: "open" });
    await setDoc(doc(context.firestore(), "orders", "order1", "items", "item1"), { productId: "p1", quantity: 1 });
  });

  const userB = testEnv.authenticatedContext("userB");
  await assertFails(getDoc(doc(userB.firestore(), "orders", "order1", "items", "item1")));
  await assertFails(setDoc(doc(userB.firestore(), "orders", "order1", "items", "item2"), { productId: "p2", quantity: 1 }));
});

test("orders/items: unauthenticated access is blocked", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "orders", "order1"), { ownerId: "userA", status: "open" });
    await setDoc(doc(context.firestore(), "orders", "order1", "items", "item1"), { productId: "p1", quantity: 1 });
  });

  const anon = testEnv.unauthenticatedContext();
  await assertFails(getDoc(doc(anon.firestore(), "orders", "order1", "items", "item1")));
});

test("userPreferences: owner can create their own preferences with a matching id and ownerId", async () => {
  const userA = testEnv.authenticatedContext("userA");
  await assertSucceeds(setDoc(doc(userA.firestore(), "userPreferences", "userA"), { ownerId: "userA", theme: "dark" }));
});

test("userPreferences: cannot create preferences under someone else's id or ownerId", async () => {
  const userA = testEnv.authenticatedContext("userA");
  await assertFails(setDoc(doc(userA.firestore(), "userPreferences", "userB"), { ownerId: "userA", theme: "dark" }));
  await assertFails(setDoc(doc(userA.firestore(), "userPreferences", "userA"), { ownerId: "userB", theme: "dark" }));
});

test("userPreferences: foreign user cannot read or update another user's preferences", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "userPreferences", "userA"), { ownerId: "userA", theme: "light" });
  });

  const userB = testEnv.authenticatedContext("userB");
  await assertFails(getDoc(doc(userB.firestore(), "userPreferences", "userA")));
  await assertFails(updateDoc(doc(userB.firestore(), "userPreferences", "userA"), { theme: "dark" }));
});

test("userPreferences: owner cannot delete or reassign ownerId on their own preferences", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "userPreferences", "userA"), { ownerId: "userA", theme: "light" });
  });

  const userA = testEnv.authenticatedContext("userA");
  await assertFails(deleteDoc(doc(userA.firestore(), "userPreferences", "userA")));
  await assertFails(updateDoc(doc(userA.firestore(), "userPreferences", "userA"), { ownerId: "userB" }));
});

test("users: owner can read and update their own profile", async () => {
  await seedUserProfile("userA", "user");
  const userA = testEnv.authenticatedContext("userA");
  await assertSucceeds(getDoc(doc(userA.firestore(), "users", "userA")));
  await assertSucceeds(updateDoc(doc(userA.firestore(), "users", "userA"), { fullName: "Updated" }));
});

test("users: a user cannot read another user's profile", async () => {
  await seedUserProfile("userA", "user");
  const userB = testEnv.authenticatedContext("userB");
  await assertFails(getDoc(doc(userB.firestore(), "users", "userA")));
});

test("users: a user cannot create their own profile with role=admin", async () => {
  const userA = testEnv.authenticatedContext("userA");
  await assertFails(setDoc(doc(userA.firestore(), "users", "userA"), { role: "admin", fullName: "A", isActive: true }));
});

test("users: a user cannot create a profile document for someone else", async () => {
  const userA = testEnv.authenticatedContext("userA");
  await assertFails(setDoc(doc(userA.firestore(), "users", "userB"), { role: "user", fullName: "B", isActive: true }));
});

test("users: a user cannot delete their own profile", async () => {
  await seedUserProfile("userA", "user");
  const userA = testEnv.authenticatedContext("userA");
  await assertFails(deleteDoc(doc(userA.firestore(), "users", "userA")));
});

test("users: a normal user cannot self-promote to admin via update", async () => {
  await seedUserProfile("userA", "user");
  const userA = testEnv.authenticatedContext("userA");
  await assertFails(updateDoc(doc(userA.firestore(), "users", "userA"), { role: "admin" }));
});

test("users: a normal user cannot reactivate a deactivated account of their own", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", "userA"), { role: "user", fullName: "A", isActive: false });
  });

  const userA = testEnv.authenticatedContext("userA");
  await assertFails(updateDoc(doc(userA.firestore(), "users", "userA"), { isActive: true }));
});

test("users: unauthenticated access is blocked for read and write", async () => {
  await seedUserProfile("userA", "user");
  const anon = testEnv.unauthenticatedContext();
  await assertFails(getDoc(doc(anon.firestore(), "users", "userA")));
  await assertFails(setDoc(doc(anon.firestore(), "users", "userC"), { role: "user", fullName: "C", isActive: true }));
});

test("known gap: even an admin cannot count/list active users across owners under the current rules", async () => {
  await seedUserProfile("userA", "user");
  await seedUserProfile("adminUser", "admin");
  const admin = testEnv.authenticatedContext("adminUser");

  // The admin dashboard's "aktive Benutzer" count needs this query to succeed for a real admin.
  // It currently does not, because /users rules only ever allow a caller to touch their own doc.
  // Left as `assertFails` on purpose: this documents the current (broken) behaviour rather than
  // approving it. See the write-up in DEVELOPMENT_PROGRESS.md for the two options to fix it.
  await assertFails(getDocs(query(collection(admin.firestore(), "users"), where("isActive", "==", true))));
});

test("sanity: seeded documents are actually visible to their real owner", async () => {
  await seedOwnerDoc("customers", "doc1", "userA");
  const userA = testEnv.authenticatedContext("userA");
  const snapshot = await getDoc(doc(userA.firestore(), "customers", "doc1"));
  assert.equal(snapshot.exists(), true);
  assert.equal(snapshot.data()?.ownerId, "userA");
});
