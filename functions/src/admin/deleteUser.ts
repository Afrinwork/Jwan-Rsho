import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";

import "@/shared/firebaseAdmin";
import { requireAdminOrSuperAdmin } from "@/shared/adminGuard";
import { deleteOwnedDocuments } from "@/shared/firestoreHelpers";
import { resolveManageableTarget } from "@/shared/userTargeting";

export const deleteUser = onCall(async (request) => {
  const caller = await requireAdminOrSuperAdmin(request);
  const { email } = request.data as { email: string };
  const { authUser } = await resolveManageableTarget(caller, email);

  await deleteOwnedDocuments(authUser.uid);
  await getFirestore().collection("users").doc(authUser.uid).delete();
  await getAuth().deleteUser(authUser.uid);

  return { success: true };
});
