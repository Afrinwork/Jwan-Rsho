import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import "@/shared/firebaseAdmin";
import { requireAdminOrSuperAdmin } from "@/shared/adminGuard";
import { resolveManageableTarget } from "@/shared/userTargeting";

// Lets a manager edit the name/email of their own admin/driver (same
// authorization matrix as deleteUser/setUserActiveState, via
// resolveManageableTarget). Updates Firebase Auth first — email is the
// account's real login identifier, so a failed Auth update must never leave
// the Firestore profile out of sync with what the user can actually sign in
// with.
export const updateManagedUser = onCall(async (request) => {
  const caller = await requireAdminOrSuperAdmin(request);
  const { email, fullName, newEmail } = request.data as {
    email: string;
    fullName?: string;
    newEmail?: string;
  };
  const { authUser } = await resolveManageableTarget(caller, email);

  const authUpdate: { displayName?: string; email?: string } = {};
  if (fullName) authUpdate.displayName = fullName;
  if (newEmail) authUpdate.email = newEmail;

  if (Object.keys(authUpdate).length > 0) {
    try {
      await getAuth().updateUser(authUser.uid, authUpdate);
    } catch (error) {
      const code = error instanceof Error && "code" in error ? String(error.code) : "";

      if (code === "auth/email-already-exists") {
        throw new HttpsError("already-exists", "Email already exists.");
      }

      throw error;
    }
  }

  await getFirestore()
    .collection("users")
    .doc(authUser.uid)
    .update({
      ...(fullName ? { fullName } : {}),
      ...(newEmail ? { email: newEmail } : {}),
    });

  return { success: true };
});
