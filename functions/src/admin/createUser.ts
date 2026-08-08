import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";

import { requireAdmin } from "@/shared/authGuard";

initializeApp();

export const createUser = onCall(async (request) => {
  requireAdmin(request);

  const { email, fullName, password } = request.data as {
    email: string;
    fullName: string;
    password: string;
  };

  const auth = getAuth();
  const createdUser = await auth.createUser({ email, password, displayName: fullName });

  await getFirestore().collection("users").doc(createdUser.uid).set({
    email,
    fullName,
    isActive: true,
    role: "user",
  });

  return { success: true };
});
