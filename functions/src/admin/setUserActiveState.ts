import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";

import "@/shared/firebaseAdmin";
import { requireAdminOrSuperAdmin } from "@/shared/adminGuard";
import { getBerlinDateKey } from "@/shared/europeBerlin";
import { resolveManageableTarget } from "@/shared/userTargeting";

// Soft alternative to deleteUser: disables the Firebase Auth account (blocks
// new sign-ins and, via revokeRefreshTokens, forces any already-signed-in
// session to sign out once its current ID token needs refreshing — usually
// within minutes, not instantly) and flips the Firestore isActive flag, but
// keeps the account and all of its data intact so it can be reactivated
// later. Same authorization matrix as deleteUser (whoever may delete a user
// may also (de)activate them).
export const setUserActiveState = onCall(async (request) => {
  const caller = await requireAdminOrSuperAdmin(request);
  const { email, isActive } = request.data as { email: string; isActive: boolean };
  const { authUser, target } = await resolveManageableTarget(caller, email);

  await getAuth().updateUser(authUser.uid, { disabled: !isActive });

  if (!isActive) {
    await getAuth().revokeRefreshTokens(authUser.uid);
  }

  const db = getFirestore();
  await db.collection("users").doc(authUser.uid).update({ isActive });

  // Releasing a driver clears only today's reporting lock. Customers and
  // orders remain untouched, and the driver must still submit the report.
  if (isActive && target.role === "driver") {
    const checkInRef = db.collection("driverCheckIns").doc(`${authUser.uid}_${getBerlinDateKey(new Date())}`);
    const checkIn = await checkInRef.get();
    if (checkIn.exists && checkIn.data().blockedReason === "no_response_by_10") {
      await checkInRef.update({ status: "pending", blockedReason: null, updatedAt: new Date().toISOString() });
    }
  }

  return { success: true };
});
