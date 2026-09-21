import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

import "@/shared/firebaseAdmin";
import { getBerlinDateKey } from "@/shared/europeBerlin";

const CHECK_IN_COLLECTION = "driverCheckIns";

// The check runs on the server, rather than on a driver's phone, so closing
// the app or changing its clock cannot bypass the daily reporting rule.
export const blockDriversMissingMorningStatus = onSchedule(
  { schedule: "0 10 * * *", timeZone: "Europe/Berlin" },
  async () => {
    const db = getFirestore();
    const auth = getAuth();
    const date = getBerlinDateKey(new Date());
    const drivers = await db.collection("users").where("role", "==", "driver").get();

    for (const driver of drivers.docs) {
      const profile = driver.data();
      if (profile.isActive === false) continue;
      if (typeof profile.managerId !== "string") continue;

      const checkInRef = db.collection(CHECK_IN_COLLECTION).doc(`${driver.id}_${date}`);
      const checkIn = await checkInRef.get();
      const data = checkIn.exists ? checkIn.data() : undefined;
      const hasCompleteReport = data?.status === "ok"
        && typeof data.address === "string" && data.address.trim().length > 0
        && Number.isFinite(data.odometerKm);
      if (hasCompleteReport) continue;

      const timestamp = new Date().toISOString();
      await db.runTransaction(async (transaction) => {
        const latest = await transaction.get(checkInRef);
        const latestData = latest.exists ? latest.data() : undefined;
        const stillMissing = latestData?.status !== "ok"
          || typeof latestData.address !== "string" || latestData.address.trim().length === 0
          || !Number.isFinite(latestData.odometerKm);
        if (!stillMissing) return;

        transaction.set(checkInRef, {
          ownerId: profile.managerId,
          driverId: driver.id,
          date,
          status: "blocked",
          blockedReason: "no_response_by_10",
          attempts: latestData?.attempts ?? 0,
          createdAt: latestData?.createdAt ?? timestamp,
          updatedAt: timestamp,
        }, { merge: true });
        transaction.update(driver.ref, { isActive: false });
      });

      await auth.updateUser(driver.id, { disabled: true });
      await auth.revokeRefreshTokens(driver.id);
    }
  },
);
