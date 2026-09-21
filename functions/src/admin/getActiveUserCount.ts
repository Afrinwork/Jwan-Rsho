import { getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";

import "@/shared/firebaseAdmin";
import { requireAdminOrSuperAdmin } from "@/shared/adminGuard";

export const getActiveUserCount = onCall(async (request) => {
  await requireAdminOrSuperAdmin(request);

  const snapshot = await getFirestore().collection("users").where("isActive", "==", true).count().get();
  return { count: snapshot.data().count };
});
