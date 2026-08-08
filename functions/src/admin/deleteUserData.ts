import { onCall } from "firebase-functions/v2/https";

import "@/shared/firebaseAdmin";
import { requireAdmin } from "@/shared/adminGuard";
import { deleteOwnedDocuments } from "@/shared/firestoreHelpers";

export const deleteUserData = onCall(async (request) => {
  await requireAdmin(request);
  const { ownerId } = request.data as { ownerId: string };
  await deleteOwnedDocuments(ownerId);
  return { success: true };
});
