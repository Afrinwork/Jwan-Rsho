import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import "@/shared/firebaseAdmin";
import { requireAdmin } from "@/shared/adminGuard";
import { deleteOwnedDocuments } from "@/shared/firestoreHelpers";

export const deleteUser = onCall(async (request) => {
  await requireAdmin(request);

  const { email } = request.data as { email: string };
  const auth = getAuth();
  let targetUser;

  try {
    targetUser = await auth.getUserByEmail(email);
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String(error.code) : "";

    if (code === "auth/user-not-found") {
      throw new HttpsError("not-found", "User not found.");
    }

    throw error;
  }
  const targetUid = targetUser.uid;

  if (request.auth?.uid === targetUid) {
    throw new HttpsError("failed-precondition", "Admin cannot delete own account.");
  }

  await deleteOwnedDocuments(targetUid);
  await getFirestore().collection("users").doc(targetUid).delete();
  await auth.deleteUser(targetUid);

  return { success: true };
});
