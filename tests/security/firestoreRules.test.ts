import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { assertFails, assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, query, runTransaction, setDoc, updateDoc, where } from "firebase/firestore";

import { createTestEnv } from "./testEnv";

const ownerScopedCollections = ["customers", "orders", "products", "countries", "regions", "cities"];

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

async function seedUserProfile(uid: string, role: "user" | "super_admin" | "admin" | "driver", managerId?: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", uid), {
      role,
      fullName: uid,
      isActive: true,
      ...(managerId ? { managerId } : {}),
    });
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

  test(`${collectionName}: a legacy admin (normalized to super_admin) grants no extra Firestore access to other owners' data`, async () => {
    await seedOwnerDoc(collectionName, "doc1", "userA");
    await seedUserProfile("adminUser", "admin");
    const admin = testEnv.authenticatedContext("adminUser");
    await assertFails(getDoc(doc(admin.firestore(), collectionName, "doc1")));
  });

  test(`${collectionName}: an explicit super_admin's own role grants no extra Firestore access to other owners' data`, async () => {
    await seedOwnerDoc(collectionName, "doc1", "userA");
    await seedUserProfile("superAdminUser", "super_admin");
    const superAdmin = testEnv.authenticatedContext("superAdminUser");
    await assertFails(getDoc(doc(superAdmin.firestore(), collectionName, "doc1")));
  });

  test(`${collectionName}: a real new-model admin (with managerId) grants no extra Firestore access to other owners' data`, async () => {
    await seedOwnerDoc(collectionName, "doc1", "userA");
    await seedUserProfile("newAdminUser", "admin", "someSuperAdmin");
    const newAdmin = testEnv.authenticatedContext("newAdminUser");
    await assertFails(getDoc(doc(newAdmin.firestore(), collectionName, "doc1")));
  });
}

test("customers: an assigned driver can read a customer belonging to their manager", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "customers", "cust1"), { ownerId: "managerA", assignedDriverId: "driverA", name: "Seed" });
  });

  const driverA = testEnv.authenticatedContext("driverA");
  await assertSucceeds(getDoc(doc(driverA.firestore(), "customers", "cust1")));
});

test("customers: a driver cannot read a customer belonging to a different manager", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "customers", "cust1"), { ownerId: "managerB", assignedDriverId: "driverA", name: "Seed" });
  });

  const driverA = testEnv.authenticatedContext("driverA");
  await assertFails(getDoc(doc(driverA.firestore(), "customers", "cust1")));
});

test("customers: a driver cannot read a customer from their own manager that isn't assigned to them", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "customers", "cust1"), { ownerId: "managerA", name: "Seed" });
  });

  const driverA = testEnv.authenticatedContext("driverA");
  await assertFails(getDoc(doc(driverA.firestore(), "customers", "cust1")));
});

test("customers: an assigned driver still cannot create, update, or delete a customer", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "customers", "cust1"), { ownerId: "managerA", assignedDriverId: "driverA", name: "Seed" });
  });

  const driverA = testEnv.authenticatedContext("driverA");
  await assertFails(setDoc(doc(driverA.firestore(), "customers", "cust2"), { ownerId: "managerA", assignedDriverId: "driverA", name: "New" }));
  await assertFails(updateDoc(doc(driverA.firestore(), "customers", "cust1"), { name: "Changed" }));
  await assertFails(deleteDoc(doc(driverA.firestore(), "customers", "cust1")));
});

test("orders: an assigned driver can read an order belonging to their manager", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "orders", "order1"), { ownerId: "managerA", assignedDriverId: "driverA", status: "open" });
  });

  const driverA = testEnv.authenticatedContext("driverA");
  await assertSucceeds(getDoc(doc(driverA.firestore(), "orders", "order1")));
});

test("orders: a driver cannot read an order belonging to a different manager or not assigned to them", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "orders", "order1"), { ownerId: "managerB", assignedDriverId: "driverA", status: "open" });
    await setDoc(doc(context.firestore(), "orders", "order2"), { ownerId: "managerA", status: "open" });
  });

  const driverA = testEnv.authenticatedContext("driverA");
  await assertFails(getDoc(doc(driverA.firestore(), "orders", "order1")));
  await assertFails(getDoc(doc(driverA.firestore(), "orders", "order2")));
});

test("orders/items: an assigned driver can read items of an order belonging to their manager", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "orders", "order1"), { ownerId: "managerA", assignedDriverId: "driverA", status: "open" });
    await setDoc(doc(context.firestore(), "orders", "order1", "items", "item1"), { productId: "p1", quantity: 1 });
  });

  const driverA = testEnv.authenticatedContext("driverA");
  await assertSucceeds(getDoc(doc(driverA.firestore(), "orders", "order1", "items", "item1")));
  await assertFails(setDoc(doc(driverA.firestore(), "orders", "order1", "items", "item2"), { productId: "p2", quantity: 1 }));
});

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

test("orders/items: owner can create a brand-new order and its items together in one transaction", async () => {
  const userA = testEnv.authenticatedContext("userA");
  const db = userA.firestore();
  const orderRef = doc(db, "orders", "order-tx-1");

  await assertSucceeds(
    runTransaction(db, async (transaction) => {
      const itemRef = doc(collection(orderRef, "items"));
      transaction.set(orderRef, { ownerId: "userA", customerId: "c1", status: "open" });
      transaction.set(itemRef, { ownerId: "userA", productId: "p1", quantity: 1 });
    }),
  );
});

test("orders: reading a not-yet-existing order (duplicate pre-check, matches real createOrder flow) does not throw", async () => {
  const userA = testEnv.authenticatedContext("userA");
  const db = userA.firestore();
  const orderRef = doc(db, "orders", "order-precheck-1");

  await assertSucceeds(
    runTransaction(db, async (transaction) => {
      const existing = await transaction.get(orderRef);
      if (existing.exists()) {
        throw new Error("should not exist yet");
      }
      transaction.set(orderRef, { ownerId: "userA", customerId: "c1", status: "open" });
    }),
  );
});

test("full createOrder flow: new customer + new order + items in one transaction succeeds end to end", async () => {
  const userA = testEnv.authenticatedContext("userA");
  const db = userA.firestore();
  const orderRef = doc(db, "orders", "order-full-flow-1");
  const customerRef = doc(db, "customers", "customer-full-flow-1");

  await assertSucceeds(
    runTransaction(db, async (transaction) => {
      const existingOrder = await transaction.get(orderRef);
      if (existingOrder.exists()) {
        throw new Error("should not exist yet");
      }

      transaction.set(customerRef, { ownerId: "userA", fullName: "Neuer Kunde" });
      transaction.set(orderRef, { ownerId: "userA", customerId: customerRef.id, status: "open" });

      const itemRef = doc(collection(orderRef, "items"));
      transaction.set(itemRef, { ownerId: "userA", productId: "p1", quantity: 2 });
    }),
  );
});

test("orders/items: creating an item without a matching ownerId is rejected", async () => {
  const userA = testEnv.authenticatedContext("userA");
  await assertFails(
    setDoc(doc(userA.firestore(), "orders", "order2", "items", "item1"), { productId: "p1", quantity: 1 }),
  );
  await assertFails(
    setDoc(doc(userA.firestore(), "orders", "order2", "items", "item1"), { ownerId: "userB", productId: "p1", quantity: 1 }),
  );
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

test("users: a legacy profile missing role/isActive fields can still save fullName/email", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", "userA"), { fullName: "Old Name" });
  });

  const userA = testEnv.authenticatedContext("userA");
  await assertSucceeds(updateDoc(doc(userA.firestore(), "users", "userA"), { fullName: "New Name" }));
});

test("users: a legacy profile missing role cannot self-promote to admin via update", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", "userA"), { fullName: "A", isActive: true });
  });

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

test("users: a super_admin can create an admin with managerId set to themselves", async () => {
  await seedUserProfile("superAdminA", "super_admin");
  const superAdminA = testEnv.authenticatedContext("superAdminA");
  await assertSucceeds(
    setDoc(doc(superAdminA.firestore(), "users", "newAdmin"), {
      role: "admin",
      fullName: "New Admin",
      isActive: true,
      managerId: "superAdminA",
    }),
  );
});

test("users: a super_admin can create a driver with managerId set to themselves", async () => {
  await seedUserProfile("superAdminA", "super_admin");
  const superAdminA = testEnv.authenticatedContext("superAdminA");
  await assertSucceeds(
    setDoc(doc(superAdminA.firestore(), "users", "newDriver"), {
      role: "driver",
      fullName: "New Driver",
      isActive: true,
      managerId: "superAdminA",
    }),
  );
});

test("users: a super_admin cannot create another user with someone else's managerId", async () => {
  await seedUserProfile("superAdminA", "super_admin");
  const superAdminA = testEnv.authenticatedContext("superAdminA");
  await assertFails(
    setDoc(doc(superAdminA.firestore(), "users", "newDriver"), {
      role: "driver",
      fullName: "New Driver",
      isActive: true,
      managerId: "someoneElse",
    }),
  );
});

test("users: nobody can create a super_admin via client rules", async () => {
  await seedUserProfile("superAdminA", "super_admin");
  const superAdminA = testEnv.authenticatedContext("superAdminA");
  await assertFails(
    setDoc(doc(superAdminA.firestore(), "users", "newSuperAdmin"), {
      role: "super_admin",
      fullName: "New Super Admin",
      isActive: true,
      managerId: "superAdminA",
    }),
  );
});

test("users: an admin can create a driver with managerId set to themselves, but not an admin", async () => {
  await seedUserProfile("adminA", "admin", "someSuperAdmin");
  const adminA = testEnv.authenticatedContext("adminA");
  await assertSucceeds(
    setDoc(doc(adminA.firestore(), "users", "newDriver"), {
      role: "driver",
      fullName: "New Driver",
      isActive: true,
      managerId: "adminA",
    }),
  );
  await assertFails(
    setDoc(doc(adminA.firestore(), "users", "newAdmin"), {
      role: "admin",
      fullName: "New Admin",
      isActive: true,
      managerId: "adminA",
    }),
  );
});

test("users: a legacy admin (no managerId) is treated as super_admin and can create admins", async () => {
  await seedUserProfile("legacyAdmin", "admin");
  const legacyAdmin = testEnv.authenticatedContext("legacyAdmin");
  await assertSucceeds(
    setDoc(doc(legacyAdmin.firestore(), "users", "newAdmin"), {
      role: "admin",
      fullName: "New Admin",
      isActive: true,
      managerId: "legacyAdmin",
    }),
  );
});

test("users: a real new-model admin (with managerId) is NOT treated as super_admin and cannot create admins", async () => {
  await seedUserProfile("newModelAdmin", "admin", "someSuperAdmin");
  const newModelAdmin = testEnv.authenticatedContext("newModelAdmin");
  await assertFails(
    setDoc(doc(newModelAdmin.firestore(), "users", "newAdmin"), {
      role: "admin",
      fullName: "New Admin",
      isActive: true,
      managerId: "newModelAdmin",
    }),
  );
});

test("users: a driver cannot create any other user", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  const driverA = testEnv.authenticatedContext("driverA");
  await assertFails(
    setDoc(doc(driverA.firestore(), "users", "newDriver"), {
      role: "driver",
      fullName: "New Driver",
      isActive: true,
      managerId: "driverA",
    }),
  );
});

test("users: a super_admin can delete an admin or a driver, but not another super_admin or themselves", async () => {
  await seedUserProfile("superAdminA", "super_admin");
  await seedUserProfile("adminB", "admin", "superAdminA");
  await seedUserProfile("driverC", "driver", "superAdminA");
  await seedUserProfile("superAdminD", "super_admin");
  const superAdminA = testEnv.authenticatedContext("superAdminA");

  await assertSucceeds(deleteDoc(doc(superAdminA.firestore(), "users", "adminB")));
  await assertSucceeds(deleteDoc(doc(superAdminA.firestore(), "users", "driverC")));
  await assertFails(deleteDoc(doc(superAdminA.firestore(), "users", "superAdminD")));
  await assertFails(deleteDoc(doc(superAdminA.firestore(), "users", "superAdminA")));
});

test("users: an admin can delete only their own driver", async () => {
  await seedUserProfile("adminA", "admin", "someSuperAdmin");
  await seedUserProfile("driverOwnedByA", "driver", "adminA");
  await seedUserProfile("adminB", "admin", "someSuperAdmin");
  await seedUserProfile("driverOwnedByB", "driver", "adminB");
  const adminA = testEnv.authenticatedContext("adminA");

  await assertSucceeds(deleteDoc(doc(adminA.firestore(), "users", "driverOwnedByA")));
  await assertFails(deleteDoc(doc(adminA.firestore(), "users", "driverOwnedByB")));
  await assertFails(deleteDoc(doc(adminA.firestore(), "users", "adminB")));
  await assertFails(deleteDoc(doc(adminA.firestore(), "users", "adminA")));
});

test("users: a legacy admin (no managerId) is treated as super_admin and can delete a legacy user (normalized to admin)", async () => {
  await seedUserProfile("legacyAdmin", "admin");
  await seedUserProfile("legacyUser", "user");
  const legacyAdmin = testEnv.authenticatedContext("legacyAdmin");
  await assertSucceeds(deleteDoc(doc(legacyAdmin.firestore(), "users", "legacyUser")));
});

test("users: a driver cannot delete any user, including themselves", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  await seedUserProfile("driverB", "driver", "managerA");
  const driverA = testEnv.authenticatedContext("driverA");
  await assertFails(deleteDoc(doc(driverA.firestore(), "users", "driverB")));
  await assertFails(deleteDoc(doc(driverA.firestore(), "users", "driverA")));
});

test("users: managerId cannot be changed via self-update", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  const driverA = testEnv.authenticatedContext("driverA");
  await assertFails(updateDoc(doc(driverA.firestore(), "users", "driverA"), { managerId: "managerB" }));
});

test("users: a super_admin can list their own drivers", async () => {
  await seedUserProfile("superAdminA", "super_admin");
  await seedUserProfile("driverOwnedByA", "driver", "superAdminA");
  await seedUserProfile("driverOwnedByB", "driver", "someoneElse");
  const superAdminA = testEnv.authenticatedContext("superAdminA");

  const snapshot = await assertSucceeds(
    getDocs(query(collection(superAdminA.firestore(), "users"), where("managerId", "==", "superAdminA"), where("role", "==", "driver"))),
  );
  assert.equal(snapshot.docs.length, 1);
  assert.equal(snapshot.docs[0].id, "driverOwnedByA");
});

test("users: an admin can list their own drivers, but cannot even query for another manager's drivers", async () => {
  await seedUserProfile("adminA", "admin", "someSuperAdmin");
  await seedUserProfile("driverOwnedByA", "driver", "adminA");
  const adminA = testEnv.authenticatedContext("adminA");

  const ownDrivers = await assertSucceeds(
    getDocs(query(collection(adminA.firestore(), "users"), where("managerId", "==", "adminA"), where("role", "==", "driver"))),
  );
  assert.equal(ownDrivers.docs.length, 1);

  // Stricter than just "returns nothing": a managerId filter for anyone
  // other than the caller's own uid can never be proven safe by the rule
  // (which only allows managerId == request.auth.uid), so Firestore rejects
  // the query outright rather than silently returning an empty result.
  await assertFails(
    getDocs(query(collection(adminA.firestore(), "users"), where("managerId", "==", "someoneElse"), where("role", "==", "driver"))),
  );
});

test("users: a driver cannot list another manager's drivers", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  const driverA = testEnv.authenticatedContext("driverA");

  await assertFails(
    getDocs(query(collection(driverA.firestore(), "users"), where("managerId", "==", "managerA"), where("role", "==", "driver"))),
  );
});

test("customers: an assigned driver can list their manager's customers assigned to them (real query shape, not just get())", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "customers", "cust1"), { ownerId: "managerA", assignedDriverId: "driverA", name: "Assigned" });
    await setDoc(doc(context.firestore(), "customers", "cust2"), { ownerId: "managerA", name: "Not assigned" });
    await setDoc(doc(context.firestore(), "customers", "cust3"), { ownerId: "managerB", assignedDriverId: "driverA", name: "Different manager" });
  });

  const driverA = testEnv.authenticatedContext("driverA");
  const snapshot = await assertSucceeds(
    getDocs(query(collection(driverA.firestore(), "customers"), where("ownerId", "==", "managerA"), where("assignedDriverId", "==", "driverA"))),
  );
  assert.equal(snapshot.docs.length, 1);
  assert.equal(snapshot.docs[0].id, "cust1");
});

test("orders: an assigned driver can list their manager's open orders assigned to them (real query shape, not just get())", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "orders", "order1"), { ownerId: "managerA", assignedDriverId: "driverA", status: "open" });
    await setDoc(doc(context.firestore(), "orders", "order2"), { ownerId: "managerA", status: "open" });
  });

  const driverA = testEnv.authenticatedContext("driverA");
  const snapshot = await assertSucceeds(
    getDocs(query(collection(driverA.firestore(), "orders"), where("ownerId", "==", "managerA"), where("assignedDriverId", "==", "driverA"))),
  );
  assert.equal(snapshot.docs.length, 1);
  assert.equal(snapshot.docs[0].id, "order1");
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

test("driverCompletionStats: owner can create/update their own driver's stat doc", async () => {
  const managerA = testEnv.authenticatedContext("managerA");
  await assertSucceeds(
    setDoc(doc(managerA.firestore(), "driverCompletionStats", "driverA"), {
      ownerId: "managerA",
      driverId: "driverA",
      date: "2026-01-01",
      count: 1,
    }),
  );
  await assertSucceeds(
    updateDoc(doc(managerA.firestore(), "driverCompletionStats", "driverA"), { count: 2 }),
  );
});

test("driverCompletionStats: cannot write a stat doc tagged with someone else's ownerId", async () => {
  const managerA = testEnv.authenticatedContext("managerA");
  await assertFails(
    setDoc(doc(managerA.firestore(), "driverCompletionStats", "driverA"), {
      ownerId: "managerB",
      driverId: "driverA",
      date: "2026-01-01",
      count: 1,
    }),
  );
});

test("driverCompletionStats: cannot write under a driverId that doesn't match the document id", async () => {
  const managerA = testEnv.authenticatedContext("managerA");
  await assertFails(
    setDoc(doc(managerA.firestore(), "driverCompletionStats", "driverA"), {
      ownerId: "managerA",
      driverId: "driverB",
      date: "2026-01-01",
      count: 1,
    }),
  );
});

test("driverCompletionStats: the owner can read it, the driver themselves can read it, nobody else can", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "driverCompletionStats", "driverA"), {
      ownerId: "managerA",
      driverId: "driverA",
      date: "2026-01-01",
      count: 3,
    });
  });

  const managerA = testEnv.authenticatedContext("managerA");
  await assertSucceeds(getDoc(doc(managerA.firestore(), "driverCompletionStats", "driverA")));

  const driverA = testEnv.authenticatedContext("driverA");
  await assertSucceeds(getDoc(doc(driverA.firestore(), "driverCompletionStats", "driverA")));

  const stranger = testEnv.authenticatedContext("stranger");
  await assertFails(getDoc(doc(stranger.firestore(), "driverCompletionStats", "driverA")));
});

test("driverCompletionStats: cannot be deleted", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "driverCompletionStats", "driverA"), {
      ownerId: "managerA",
      driverId: "driverA",
      date: "2026-01-01",
      count: 3,
    });
  });

  const managerA = testEnv.authenticatedContext("managerA");
  await assertFails(deleteDoc(doc(managerA.firestore(), "driverCompletionStats", "driverA")));
});

test("sanity: seeded documents are actually visible to their real owner", async () => {
  await seedOwnerDoc("customers", "doc1", "userA");
  const userA = testEnv.authenticatedContext("userA");
  const snapshot = await getDoc(doc(userA.firestore(), "customers", "doc1"));
  assert.equal(snapshot.exists(), true);
  assert.equal(snapshot.data()?.ownerId, "userA");
});
