import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import "@/shared/firebaseAdmin";
import { requireAuthenticated } from "@/shared/authGuard";
import { normalizeLegacyRole, UserRole } from "@/shared/permissions";

export type CallerRole = {
  uid: string;
  role: UserRole;
  managerId?: string;
};

export async function requireCallerRole(request: { auth?: { uid?: string } }): Promise<CallerRole> {
  requireAuthenticated(request);

  const uid = request.auth?.uid as string;
  const snapshot = await getFirestore().collection("users").doc(uid).get();

  if (!snapshot.exists) {
    throw new HttpsError("permission-denied", "No user profile found.");
  }

  const data = snapshot.data()!;
  return {
    uid,
    role: normalizeLegacyRole(data.role, data.managerId),
    managerId: data.managerId as string | undefined,
  };
}

export async function requireAdminOrSuperAdmin(request: { auth?: { uid?: string } }): Promise<CallerRole> {
  const caller = await requireCallerRole(request);

  if (caller.role !== "super_admin" && caller.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin access required.");
  }

  return caller;
}

export async function requireSuperAdmin(request: { auth?: { uid?: string } }): Promise<CallerRole> {
  const caller = await requireCallerRole(request);

  if (caller.role !== "super_admin") {
    throw new HttpsError("permission-denied", "Super admin access required.");
  }

  return caller;
}
