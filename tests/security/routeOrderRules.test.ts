import { after, before, beforeEach, test } from "node:test";
import { assertFails, assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";

import { createTestEnv } from "./testEnv";

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await createTestEnv("demo-rsho-route-order-1");
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedUserProfile("managerA", "admin", "superA");
  await seedUserProfile("managerB", "admin", "superA");
  await seedUserProfile("driverA", "driver", "managerA");
  await seedUserProfile("driverB", "driver", "managerA");
});

after(async () => {
  await testEnv.cleanup();
});

async function seedUserProfile(uid: string, role: "super_admin" | "admin" | "driver", managerId?: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", uid), { role, fullName: uid, isActive: true, ...(managerId ? { managerId } : {}) });
  });
}

async function seedRouteOrder(userId: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "routeOrders", userId), routeOrder(userId, userId));
  });
}

function routeOrder(userId: string, updatedBy: string, customerIds: string[] = ["c1", "c2"]) {
  return { userId, customerIds, updatedBy, updatedAt: "2026-09-26T08:00:00.000Z" };
}

test("routeOrders: a driver can write and read their own list", async () => {
  const driverA = testEnv.authenticatedContext("driverA").firestore();
  await assertSucceeds(setDoc(doc(driverA, "routeOrders", "driverA"), routeOrder("driverA", "driverA")));
  await assertSucceeds(getDoc(doc(driverA, "routeOrders", "driverA")));
  await assertSucceeds(deleteDoc(doc(driverA, "routeOrders", "driverA")));
});

test("routeOrders: an admin can write and read their own list", async () => {
  const managerA = testEnv.authenticatedContext("managerA").firestore();
  await assertSucceeds(setDoc(doc(managerA, "routeOrders", "managerA"), routeOrder("managerA", "managerA")));
});

test("routeOrders: the managing admin can re-sort their driver's list", async () => {
  await seedRouteOrder("driverA");
  const managerA = testEnv.authenticatedContext("managerA").firestore();
  await assertSucceeds(getDoc(doc(managerA, "routeOrders", "driverA")));
  await assertSucceeds(setDoc(doc(managerA, "routeOrders", "driverA"), routeOrder("driverA", "managerA", ["c2", "c1"])));
  await assertSucceeds(deleteDoc(doc(managerA, "routeOrders", "driverA")));
});

test("routeOrders: another admin cannot read or write a driver they don't manage", async () => {
  await seedRouteOrder("driverA");
  const managerB = testEnv.authenticatedContext("managerB").firestore();
  await assertFails(getDoc(doc(managerB, "routeOrders", "driverA")));
  await assertFails(setDoc(doc(managerB, "routeOrders", "driverA"), routeOrder("driverA", "managerB")));
  await assertFails(deleteDoc(doc(managerB, "routeOrders", "driverA")));
});

test("routeOrders: a driver cannot read or write another driver's list", async () => {
  await seedRouteOrder("driverB");
  const driverA = testEnv.authenticatedContext("driverA").firestore();
  await assertFails(getDoc(doc(driverA, "routeOrders", "driverB")));
  await assertFails(setDoc(doc(driverA, "routeOrders", "driverB"), routeOrder("driverB", "driverA")));
});

test("routeOrders: a driver cannot touch their manager's own list", async () => {
  const driverA = testEnv.authenticatedContext("driverA").firestore();
  await assertFails(setDoc(doc(driverA, "routeOrders", "managerA"), routeOrder("managerA", "driverA")));
});

test("routeOrders: writes must name the caller as updatedBy, match the doc id and carry no extra fields", async () => {
  const driverA = testEnv.authenticatedContext("driverA").firestore();
  await assertFails(setDoc(doc(driverA, "routeOrders", "driverA"), routeOrder("driverA", "managerA")));
  await assertFails(setDoc(doc(driverA, "routeOrders", "driverA"), routeOrder("driverB", "driverA")));
  await assertFails(setDoc(doc(driverA, "routeOrders", "driverA"), { ...routeOrder("driverA", "driverA"), extra: true }));
});

test("routeOrders: signed-out users have no access", async () => {
  await seedRouteOrder("driverA");
  const anonymous = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(anonymous, "routeOrders", "driverA")));
});
