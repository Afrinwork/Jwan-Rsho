import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";

import "@/shared/firebaseAdmin";
import { requireAuthenticated } from "@/shared/authGuard";
import { deleteOwnedDocuments } from "@/shared/firestoreHelpers";

export const deleteOwnAccount = onCall(async (request) => {
  requireAuthenticated(request);

  const uid = request.auth?.uid as string;

  await deleteOwnedDocuments(uid);
  await getFirestore().collection("users").doc(uid).delete();
  await getAuth().deleteUser(uid);

  return { success: true };
});
