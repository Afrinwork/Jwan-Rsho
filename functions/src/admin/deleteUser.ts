import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { requireAdmin } from "@/shared/authGuard";
import { deleteOwnedDocuments } from "@/shared/firestoreHelpers";

initializeApp();

async function resolveUid(identifier: string) {
  const auth = getAuth();

  if (identifier.includes("@")) {
    const user = await auth.getUserByEmail(identifier);
    return user.uid;
  }

  return identifier;
}

export const deleteUser = onCall(async (request) => {
  requireAdmin(request);

  const { identifier } = request.data as { identifier: string };
  const targetUid = await resolveUid(identifier);

  if (request.auth?.uid === targetUid) {
    throw new HttpsError("failed-precondition", "Admin cannot delete own account.");
  }

  await deleteOwnedDocuments(targetUid);
  await getFirestore().collection("users").doc(targetUid).delete();
  await getAuth().deleteUser(targetUid);

  return { success: true };
});
