import { onCall } from "firebase-functions/v2/https";

import "@/shared/firebaseAdmin";
import { requireSuperAdmin } from "@/shared/adminGuard";
import { deleteOwnedDocuments } from "@/shared/firestoreHelpers";

// Unreferenced by any client call site today (verified) — the guard is
// narrowed to requireSuperAdmin as a minimal blast-radius reduction since it
// deletes arbitrary owner data with no ownership check. Full fix (proper
// ownership enforcement, or removing this dead endpoint) is a deliberate
// later decision, not part of Stage 1 — see the Stage 1 plan's open items.
export const deleteUserData = onCall(async (request) => {
  await requireSuperAdmin(request);
  const { ownerId } = request.data as { ownerId: string };
  await deleteOwnedDocuments(ownerId);
  return { success: true };
});
