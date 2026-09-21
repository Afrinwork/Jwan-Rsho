import { after, before, beforeEach, test } from "node:test";
import { assertFails, assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import { createTestEnv } from "./testEnv";

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await createTestEnv("demo-rsho-checkin-1");
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

async function seedUserProfile(uid: string, role: "super_admin" | "admin" | "driver", managerId?: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", uid), {
      role,
      fullName: uid,
      isActive: true,
      ...(managerId ? { managerId } : {}),
    });
  });
}

async function seedCheckIn(id: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "driverCheckIns", id), data);
  });
}

function baseCheckIn(driverId: string, ownerId: string, date = "2026-01-01") {
  return {
    ownerId,
    driverId,
    date,
    status: "pending",
    attempts: 0,
    createdAt: "2026-01-01T05:00:00.000Z",
    updatedAt: "2026-01-01T05:00:00.000Z",
  };
}

test("driverCheckIns: a driver can create their own doc for today", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  const driverA = testEnv.authenticatedContext("driverA");
  await assertSucceeds(
    setDoc(doc(driverA.firestore(), "driverCheckIns", "driverA_2026-01-01"), baseCheckIn("driverA", "managerA")),
  );
});

test("driverCheckIns: a driver cannot create a doc with someone else's driverId", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  const driverA = testEnv.authenticatedContext("driverA");
  await assertFails(
    setDoc(doc(driverA.firestore(), "driverCheckIns", "driverB_2026-01-01"), baseCheckIn("driverB", "managerA")),
  );
});

test("driverCheckIns: a driver cannot create a doc with the wrong ownerId (not their real manager)", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  const driverA = testEnv.authenticatedContext("driverA");
  await assertFails(
    setDoc(doc(driverA.firestore(), "driverCheckIns", "driverA_2026-01-01"), baseCheckIn("driverA", "someoneElse")),
  );
});

test("driverCheckIns: the doc id must match driverId_date", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  const driverA = testEnv.authenticatedContext("driverA");
  await assertFails(
    setDoc(doc(driverA.firestore(), "driverCheckIns", "driverA_wrong-date"), baseCheckIn("driverA", "managerA")),
  );
});

test("driverCheckIns: a super_admin/admin cannot create a check-in doc themselves", async () => {
  await seedUserProfile("superAdminA", "super_admin");
  const superAdminA = testEnv.authenticatedContext("superAdminA");
  await assertFails(
    setDoc(doc(superAdminA.firestore(), "driverCheckIns", "driverA_2026-01-01"), baseCheckIn("driverA", "superAdminA")),
  );
});

test("driverCheckIns: a driver can freely update their own doc, including reaching status ok", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  await seedCheckIn("driverA_2026-01-01", baseCheckIn("driverA", "managerA"));
  const driverA = testEnv.authenticatedContext("driverA");
  await assertSucceeds(
    updateDoc(doc(driverA.firestore(), "driverCheckIns", "driverA_2026-01-01"), {
      status: "ok",
      address: "Main St 1, Berlin",
      latitude: 52.5,
      longitude: 13.4,
      gpsAccuracy: 12,
      photoStoragePath: "driverCheckIns/managerA/driverA/2026-01-01.jpg",
      completedAt: "2026-01-01T05:30:00.000Z",
      updatedAt: "2026-01-01T05:30:00.000Z",
    }),
  );
});

test("driverCheckIns: a driver can clear their own max_attempts block by resubmitting", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  await seedCheckIn("driverA_2026-01-01", {
    ...baseCheckIn("driverA", "managerA"),
    status: "blocked",
    blockedReason: "max_attempts",
    attempts: 3,
  });
  const driverA = testEnv.authenticatedContext("driverA");
  await assertSucceeds(
    updateDoc(doc(driverA.firestore(), "driverCheckIns", "driverA_2026-01-01"), {
      status: "pending",
      blockedReason: "max_attempts",
      attempts: 0,
      updatedAt: "2026-01-01T06:00:00.000Z",
    }),
  );
});

test("driverCheckIns: a driver cannot clear an admin-imposed block themselves", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  await seedCheckIn("driverA_2026-01-01", {
    ...baseCheckIn("driverA", "managerA"),
    status: "blocked",
    blockedReason: "admin_blocked",
  });
  const driverA = testEnv.authenticatedContext("driverA");
  await assertFails(
    updateDoc(doc(driverA.firestore(), "driverCheckIns", "driverA_2026-01-01"), {
      status: "pending",
      blockedReason: "max_attempts",
      updatedAt: "2026-01-01T06:00:00.000Z",
    }),
  );
});

test("driverCheckIns: a driver cannot change the doc's driverId/ownerId/date on update", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  await seedCheckIn("driverA_2026-01-01", baseCheckIn("driverA", "managerA"));
  const driverA = testEnv.authenticatedContext("driverA");
  await assertFails(
    updateDoc(doc(driverA.firestore(), "driverCheckIns", "driverA_2026-01-01"), { ownerId: "someoneElse" }),
  );
});

test("driverCheckIns: the manager can block/unblock but only touch status/blockedReason/updatedAt", async () => {
  await seedUserProfile("managerA", "admin", "someSuperAdmin");
  await seedUserProfile("driverA", "driver", "managerA");
  await seedCheckIn("driverA_2026-01-01", baseCheckIn("driverA", "managerA"));
  const managerA = testEnv.authenticatedContext("managerA");

  await assertSucceeds(
    updateDoc(doc(managerA.firestore(), "driverCheckIns", "driverA_2026-01-01"), {
      status: "blocked",
      blockedReason: "admin_blocked",
      updatedAt: "2026-01-01T07:00:00.000Z",
    }),
  );

  await assertFails(
    updateDoc(doc(managerA.firestore(), "driverCheckIns", "driverA_2026-01-01"), {
      status: "pending",
      blockedReason: "admin_blocked",
      updatedAt: "2026-01-01T08:00:00.000Z",
      latitude: 1,
    }),
  );
});

test("driverCheckIns: a manager cannot update a driver that isn't theirs", async () => {
  await seedUserProfile("managerA", "admin", "someSuperAdmin");
  await seedUserProfile("driverA", "driver", "managerB");
  await seedCheckIn("driverA_2026-01-01", baseCheckIn("driverA", "managerB"));
  const managerA = testEnv.authenticatedContext("managerA");
  await assertFails(
    updateDoc(doc(managerA.firestore(), "driverCheckIns", "driverA_2026-01-01"), {
      status: "blocked",
      blockedReason: "admin_blocked",
    }),
  );
});

test("driverCheckIns: the driver can read their own doc, the manager can read it, a stranger cannot", async () => {
  await seedUserProfile("managerA", "admin", "someSuperAdmin");
  await seedUserProfile("driverA", "driver", "managerA");
  await seedCheckIn("driverA_2026-01-01", baseCheckIn("driverA", "managerA"));

  const driverA = testEnv.authenticatedContext("driverA");
  await assertSucceeds(getDoc(doc(driverA.firestore(), "driverCheckIns", "driverA_2026-01-01")));

  const managerA = testEnv.authenticatedContext("managerA");
  await assertSucceeds(getDoc(doc(managerA.firestore(), "driverCheckIns", "driverA_2026-01-01")));

  const stranger = testEnv.authenticatedContext("stranger");
  await assertFails(getDoc(doc(stranger.firestore(), "driverCheckIns", "driverA_2026-01-01")));
});

test("driverCheckIns: a manager cannot read a different manager's driver check-in", async () => {
  await seedUserProfile("managerA", "admin", "someSuperAdmin");
  await seedUserProfile("managerB", "admin", "someSuperAdmin");
  await seedUserProfile("driverA", "driver", "managerA");
  await seedCheckIn("driverA_2026-01-01", baseCheckIn("driverA", "managerA"));

  const managerB = testEnv.authenticatedContext("managerB");
  await assertFails(getDoc(doc(managerB.firestore(), "driverCheckIns", "driverA_2026-01-01")));
});

test("driverCheckIns: unauthenticated access is blocked for read and write", async () => {
  await seedUserProfile("driverA", "driver", "managerA");
  await seedCheckIn("driverA_2026-01-01", baseCheckIn("driverA", "managerA"));

  const anon = testEnv.unauthenticatedContext();
  await assertFails(getDoc(doc(anon.firestore(), "driverCheckIns", "driverA_2026-01-01")));
  await assertFails(setDoc(doc(anon.firestore(), "driverCheckIns", "driverA_2026-01-02"), baseCheckIn("driverA", "managerA", "2026-01-02")));
});

test("driverCheckIns: nobody can delete a check-in doc directly", async () => {
  await seedUserProfile("managerA", "admin", "someSuperAdmin");
  await seedUserProfile("driverA", "driver", "managerA");
  await seedCheckIn("driverA_2026-01-01", baseCheckIn("driverA", "managerA"));

  const driverA = testEnv.authenticatedContext("driverA");
  await assertFails(deleteDoc(doc(driverA.firestore(), "driverCheckIns", "driverA_2026-01-01")));

  const managerA = testEnv.authenticatedContext("managerA");
  await assertFails(deleteDoc(doc(managerA.firestore(), "driverCheckIns", "driverA_2026-01-01")));
});
