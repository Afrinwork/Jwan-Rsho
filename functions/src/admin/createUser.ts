import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import "@/shared/firebaseAdmin";
import { requireAdmin } from "@/shared/adminGuard";

export const createUser = onCall(async (request) => {
  await requireAdmin(request);

  const { email, fullName, password } = request.data as {
    email: string;
    fullName: string;
    password: string;
  };

  const auth = getAuth();
  let createdUser;

  try {
    createdUser = await auth.createUser({ email, password, displayName: fullName });
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String(error.code) : "";

    if (code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "Email already exists.");
    }

    throw error;
  }

  await getFirestore().collection("users").doc(createdUser.uid).set({
    email,
    fullName,
    isActive: true,
    role: "user",
  });

  return { success: true };
});
