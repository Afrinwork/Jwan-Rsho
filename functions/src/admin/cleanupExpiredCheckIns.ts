import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { onSchedule } from "firebase-functions/v2/scheduler";

import "@/shared/firebaseAdmin";
import { getBerlinDateKeyDaysAgo } from "@/shared/europeBerlin";

const RETENTION_DAYS = 3;

// Runs daily; deletes driverCheckIns docs (and their Storage photo) once
// their `date` is more than 3 Berlin calendar days old — see the Stage 1
// plan for why this needs a scheduled function rather than Firestore-native
// TTL (TTL only deletes documents, never the Storage photo they reference).
// The Storage object is deleted BEFORE the Firestore doc on each one, so a
// mid-run failure leaves at most an orphaned doc (safe, retried next run),
// never an orphaned photo with nothing left pointing at it.
//
// Must be deployed (firebase deploy --only functions) to actually take
// effect — see the Stage 1 plan's deploy caveat.
export const cleanupExpiredCheckIns = onSchedule("every day 03:00", async () => {
  const db = getFirestore();
  const cutoff = getBerlinDateKeyDaysAgo(RETENTION_DAYS);
  const snapshot = await db.collection("driverCheckIns").where("date", "<", cutoff).get();
  const bucket = getStorage().bucket();
  const writer = db.bulkWriter();

  for (const docSnapshot of snapshot.docs) {
    const photoPath = docSnapshot.data().photoStoragePath as string | undefined;

    if (photoPath) {
      await bucket.file(photoPath).delete({ ignoreNotFound: true });
    }

    writer.delete(docSnapshot.ref);
  }

  await writer.close();
});
