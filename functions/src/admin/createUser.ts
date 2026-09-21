import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import "@/shared/firebaseAdmin";
import { requireAdminOrSuperAdmin } from "@/shared/adminGuard";
import { canCreateRole, UserRole } from "@/shared/permissions";

export const createUser = onCall(async (request) => {
  const caller = await requireAdminOrSuperAdmin(request);

  const { email, fullName, password, role: requestedRole } = request.data as {
    email: string;
    fullName: string;
    password: string;
    role?: UserRole;
  };

  // Defaults to "driver" (least privilege) since the client doesn't send a
  // role yet in Stage 1 — no role picker exists until Stage 3. Once it does,
  // an explicit role from the client is still checked against the same rule.
  const role: UserRole = requestedRole ?? "driver";

  if (!canCreateRole(caller.role, role)) {
    throw new HttpsError("permission-denied", "Not allowed to create this role.");
  }

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
    role,
    // Always set server-side from the caller's own uid — never trust a
    // client-supplied managerId. This is load-bearing for the legacy-role
    // disambiguation (see shared/permissions.ts): a freshly created "admin"
    // must always carry a managerId so it's never mistaken for a legacy
    // unmigrated super_admin.
    managerId: request.auth!.uid,
  });

  return { success: true };
});
