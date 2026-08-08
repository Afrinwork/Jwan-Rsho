import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import "@/shared/firebaseAdmin";
import { requireAuthenticated } from "@/shared/authGuard";

export async function requireAdmin(request: { auth?: { uid?: string } }) {
  requireAuthenticated(request);

  const uid = request.auth?.uid;
  const snapshot = await getFirestore().collection("users").doc(uid as string).get();

  if (!snapshot.exists || snapshot.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin access required.");
  }
}
