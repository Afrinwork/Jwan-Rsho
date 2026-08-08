import { after, before, test } from "node:test";
import assert from "node:assert/strict";

import {
  adminAuth,
  adminFirestore,
  callCreateUser,
  callDeleteUser,
  callDeleteUserData,
  createTestUser,
  signInAsClient,
  uniqueId,
} from "./functionsTestEnv";

let adminUser: Awaited<ReturnType<typeof createTestUser>>;

before(async () => {
  adminUser = await createTestUser("admin");
});

after(async () => {
  // Emulator process is torn down by `firebase emulators:exec` right after this file exits.
});

test("a normal user calling createUser is rejected", async () => {
  const normalUser = await createTestUser("user");
  const session = await signInAsClient(normalUser.email, normalUser.password);

  await assert.rejects(
    () => callCreateUser(session, { email: `${uniqueId("blocked")}@example.com`, fullName: "Blocked", password: "Test1234!" }),
    (error: { code?: string }) => {
      assert.match(String(error.code), /permission-denied/);
      return true;
    },
  );
});

test("a normal user calling deleteUser is rejected", async () => {
  const normalUser = await createTestUser("user");
  const otherUser = await createTestUser("user");
  const session = await signInAsClient(normalUser.email, normalUser.password);

  await assert.rejects(
    () => callDeleteUser(session, { email: otherUser.email }),
    (error: { code?: string }) => {
      assert.match(String(error.code), /permission-denied/);
      return true;
    },
  );

  const stillExists = await adminAuth().getUser(otherUser.uid);
  assert.equal(stillExists.uid, otherUser.uid);
});

test("an admin cannot delete their own account", async () => {
  const session = await signInAsClient(adminUser.email, adminUser.password);

  await assert.rejects(
    () => callDeleteUser(session, { email: adminUser.email }),
    (error: { code?: string }) => {
      assert.match(String(error.code), /failed-precondition/);
      return true;
    },
  );

  const stillExists = await adminAuth().getUser(adminUser.uid);
  assert.equal(stillExists.uid, adminUser.uid);
});

test("an admin can create a new normal user via createUser", async () => {
  const session = await signInAsClient(adminUser.email, adminUser.password);
  const email = `${uniqueId("created")}@example.com`;

  const result = await callCreateUser(session, { email, fullName: "Neuer Kunde", password: "Test1234!" });
  assert.equal((result.data as { success: boolean }).success, true);

  const createdAuthUser = await adminAuth().getUserByEmail(email);
  const profileSnapshot = await adminFirestore().collection("users").doc(createdAuthUser.uid).get();
  assert.equal(profileSnapshot.exists, true);
  assert.equal(profileSnapshot.data()?.role, "user");
});

test("an admin deleting another user removes the Auth account and every owned collection", async () => {
  const target = await createTestUser("user");
  const db = adminFirestore();

  await db.collection("customers").doc("customer1").set({ ownerId: target.uid, fullName: "Kunde" });
  await db.collection("orders").doc("order1").set({ ownerId: target.uid, status: "open" });
  await db.collection("orders").doc("order1").collection("items").doc("item1").set({ productId: "p1", quantity: 1 });
  await db.collection("products").doc("product1").set({ ownerId: target.uid, name: "Produkt" });
  await db.collection("countries").doc("country1").set({ ownerId: target.uid, name: "Land" });
  await db.collection("regions").doc("region1").set({ ownerId: target.uid, name: "Region" });
  await db.collection("userPreferences").doc(target.uid).set({ ownerId: target.uid, theme: "dark" });

  const session = await signInAsClient(adminUser.email, adminUser.password);
  const result = await callDeleteUser(session, { email: target.email });
  assert.equal((result.data as { success: boolean }).success, true);

  await assert.rejects(() => adminAuth().getUser(target.uid));

  const userProfile = await db.collection("users").doc(target.uid).get();
  assert.equal(userProfile.exists, false);

  const customerDoc = await db.collection("customers").doc("customer1").get();
  assert.equal(customerDoc.exists, false);

  const orderDoc = await db.collection("orders").doc("order1").get();
  assert.equal(orderDoc.exists, false);

  const orderItemDoc = await db.collection("orders").doc("order1").collection("items").doc("item1").get();
  assert.equal(orderItemDoc.exists, false);

  const productDoc = await db.collection("products").doc("product1").get();
  assert.equal(productDoc.exists, false);

  const countryDoc = await db.collection("countries").doc("country1").get();
  assert.equal(countryDoc.exists, false);

  const regionDoc = await db.collection("regions").doc("region1").get();
  assert.equal(regionDoc.exists, false);

  const preferencesDoc = await db.collection("userPreferences").doc(target.uid).get();
  assert.equal(preferencesDoc.exists, false);
});

test("a normal user calling deleteUserData is rejected", async () => {
  const normalUser = await createTestUser("user");
  const session = await signInAsClient(normalUser.email, normalUser.password);

  await assert.rejects(
    () => callDeleteUserData(session, { ownerId: adminUser.uid }),
    (error: { code?: string }) => {
      assert.match(String(error.code), /permission-denied/);
      return true;
    },
  );
});

test("an admin calling deleteUserData wipes owned collections but leaves the Auth account and profile untouched", async () => {
  const target = await createTestUser("user");
  const db = adminFirestore();

  await db.collection("customers").doc("customer2").set({ ownerId: target.uid, fullName: "Kunde" });
  await db.collection("products").doc("product2").set({ ownerId: target.uid, name: "Produkt" });

  const session = await signInAsClient(adminUser.email, adminUser.password);
  const result = await callDeleteUserData(session, { ownerId: target.uid });
  assert.equal((result.data as { success: boolean }).success, true);

  const customerDoc = await db.collection("customers").doc("customer2").get();
  assert.equal(customerDoc.exists, false);

  const productDoc = await db.collection("products").doc("product2").get();
  assert.equal(productDoc.exists, false);

  const stillExistsInAuth = await adminAuth().getUser(target.uid);
  assert.equal(stillExistsInAuth.uid, target.uid);

  const profileDoc = await db.collection("users").doc(target.uid).get();
  assert.equal(profileDoc.exists, true);
});
