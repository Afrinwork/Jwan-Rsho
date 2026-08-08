import { onCall } from "firebase-functions/v2/https";

import { requireAdmin } from "@/shared/authGuard";
import { deleteOwnedDocuments } from "@/shared/firestoreHelpers";

export const deleteUserData = onCall(async (request) => {
  requireAdmin(request);
  await deleteOwnedDocuments(request.data.ownerId as string);
  return { success: true };
});
