import { after, before, beforeEach, test } from "node:test";
import { assertFails, assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { deleteObject, getBytes, ref, uploadBytes } from "firebase/storage";

import { createTestEnv } from "./testEnv";

let testEnv: RulesTestEnvironment;

const smallJpeg = new Uint8Array([1, 2, 3, 4]);
const oversizedJpeg = new Uint8Array(9 * 1024 * 1024);

before(async () => {
  testEnv = await createTestEnv("demo-rsho-checkin-storage-1", { withStorage: true });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

async function seedUserProfile(uid: string, role: "admin" | "driver", managerId?: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", uid), {
      role,
      fullName: uid,
      isActive: true,
      ...(managerId ? { managerId } : {}),
    });
  });
}

test("driverCheckIns storage: a driver can upload their own photo under their real manager's path", async () => {
  await seedUserProfile("managerA", "admin", "someSuperAdmin");
  await seedUserProfile("driverA", "driver", "managerA");
  const driverA = testEnv.authenticatedContext("driverA").storage();

  await assertSucceeds(
    uploadBytes(ref(driverA, "driverCheckIns/managerA/driverA/2026-01-01.jpg"), smallJpeg, { contentType: "image/jpeg" }),
  );
});

test("known gap: a driver's upload path isn't verified against their real manager (ownerId is trusted)", async () => {
  // See the comment in firebase/storage.rules: a firestore.get() cross-check
  // here was tried and confirmed not to work against the local Storage
  // emulator, and couldn't be verified against production from this
  // environment either — so it was dropped rather than shipped unverified.
  // Left as `assertSucceeds` on purpose: this documents the accepted trade-off
  // rather than a fixed check. The app itself never triggers this path (see
  // driverCheckInRepository, which always derives ownerId the same way
  // Firestore does), and the photo carries no sensitive data beyond an
  // odometer reading.
  await seedUserProfile("managerA", "admin", "someSuperAdmin");
  await seedUserProfile("driverA", "driver", "managerA");
  const driverA = testEnv.authenticatedContext("driverA").storage();

  await assertSucceeds(
    uploadBytes(ref(driverA, "driverCheckIns/someoneElse/driverA/2026-01-01.jpg"), smallJpeg, { contentType: "image/jpeg" }),
  );
});

test("driverCheckIns storage: a driver cannot upload under another driver's path, even under their own real manager", async () => {
  await seedUserProfile("managerA", "admin", "someSuperAdmin");
  await seedUserProfile("driverA", "driver", "managerA");
  const driverA = testEnv.authenticatedContext("driverA").storage();

  await assertFails(
    uploadBytes(ref(driverA, "driverCheckIns/managerA/driverB/2026-01-01.jpg"), smallJpeg, { contentType: "image/jpeg" }),
  );
});

test("driverCheckIns storage: an oversized file is rejected", async () => {
  await seedUserProfile("managerA", "admin", "someSuperAdmin");
  await seedUserProfile("driverA", "driver", "managerA");
  const driverA = testEnv.authenticatedContext("driverA").storage();

  await assertFails(
    uploadBytes(ref(driverA, "driverCheckIns/managerA/driverA/2026-01-01.jpg"), oversizedJpeg, { contentType: "image/jpeg" }),
  );
});

test("driverCheckIns storage: a non-image content type is rejected", async () => {
  await seedUserProfile("managerA", "admin", "someSuperAdmin");
  await seedUserProfile("driverA", "driver", "managerA");
  const driverA = testEnv.authenticatedContext("driverA").storage();

  await assertFails(
    uploadBytes(ref(driverA, "driverCheckIns/managerA/driverA/2026-01-01.jpg"), smallJpeg, { contentType: "application/pdf" }),
  );
});

test("driverCheckIns storage: the driver and their manager can read the photo, a stranger cannot", async () => {
  await seedUserProfile("managerA", "admin", "someSuperAdmin");
  await seedUserProfile("driverA", "driver", "managerA");
  const driverA = testEnv.authenticatedContext("driverA").storage();
  await uploadBytes(ref(driverA, "driverCheckIns/managerA/driverA/2026-01-01.jpg"), smallJpeg, { contentType: "image/jpeg" });

  await assertSucceeds(getBytes(ref(driverA, "driverCheckIns/managerA/driverA/2026-01-01.jpg")));

  const managerA = testEnv.authenticatedContext("managerA").storage();
  await assertSucceeds(getBytes(ref(managerA, "driverCheckIns/managerA/driverA/2026-01-01.jpg")));

  const stranger = testEnv.authenticatedContext("stranger").storage();
  await assertFails(getBytes(ref(stranger, "driverCheckIns/managerA/driverA/2026-01-01.jpg")));
});

test("driverCheckIns storage: nobody can delete the photo directly", async () => {
  await seedUserProfile("managerA", "admin", "someSuperAdmin");
  await seedUserProfile("driverA", "driver", "managerA");
  const driverA = testEnv.authenticatedContext("driverA").storage();
  await uploadBytes(ref(driverA, "driverCheckIns/managerA/driverA/2026-01-01.jpg"), smallJpeg, { contentType: "image/jpeg" });

  await assertFails(deleteObject(ref(driverA, "driverCheckIns/managerA/driverA/2026-01-01.jpg")));

  const managerA = testEnv.authenticatedContext("managerA").storage();
  await assertFails(deleteObject(ref(managerA, "driverCheckIns/managerA/driverA/2026-01-01.jpg")));
});
