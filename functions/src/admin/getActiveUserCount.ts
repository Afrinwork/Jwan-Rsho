import { getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";

import "@/shared/firebaseAdmin";
import { requireAdmin } from "@/shared/adminGuard";

export const getActiveUserCount = onCall(async (request) => {
  await requireAdmin(request);

  const snapshot = await getFirestore().collection("users").where("isActive", "==", true).count().get();
  return { count: snapshot.data().count };
});
