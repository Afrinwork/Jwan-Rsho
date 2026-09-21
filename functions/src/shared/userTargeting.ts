import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import { canDeleteUser, normalizeLegacyRole } from "@/shared/permissions";
import { CallerRole } from "@/shared/adminGuard";

// Shared by any admin action that targets another user by email (delete,
// deactivate/reactivate, ...) — resolves the Auth user, blocks self-targeting,
// and enforces the same super_admin/admin authorization matrix as deletion
// (whoever may delete a user may also change their active state).
export async function resolveManageableTarget(caller: CallerRole, email: string) {
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

  if (caller.uid === targetUser.uid) {
    throw new HttpsError("failed-precondition", "Cannot target your own account.");
  }

  const targetSnapshot = await getFirestore().collection("users").doc(targetUser.uid).get();
  if (!targetSnapshot.exists) {
    throw new HttpsError("failed-precondition", "Target user has no profile document.");
  }

  const targetData = targetSnapshot.data()!;
  const target = {
    id: targetUser.uid,
    role: normalizeLegacyRole(targetData.role, targetData.managerId),
    managerId: targetData.managerId as string | undefined,
  };

  if (!canDeleteUser(caller, target)) {
    throw new HttpsError("permission-denied", "Not allowed to manage this user.");
  }

  return { authUser: targetUser, target };
}
