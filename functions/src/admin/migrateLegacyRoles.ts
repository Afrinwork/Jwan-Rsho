import { getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";

import "@/shared/firebaseAdmin";
import { requireSuperAdmin } from "@/shared/adminGuard";

// One-time migration: relabels legacy role strings to the new 3-role model.
// role:"admin" with no managerId (an old full-admin account) -> super_admin.
// role:"user" (the old default account) -> admin, so it keeps its existing
// full self-scoped access instead of losing it by becoming a driver.
//
// Safe to run at any time relative to the Stage 1 rules/functions deploy, and
// safe to re-run: requireSuperAdmin's own normalization already treats an
// unmigrated legacy "admin" caller as super_admin-equivalent, and once a doc
// is migrated it no longer matches either legacy condition, so a second run
// touches zero documents. Must be triggered manually against production —
// see the Stage 1 plan for invocation options.
export const migrateLegacyRoles = onCall(async (request) => {
  await requireSuperAdmin(request);

  const db = getFirestore();
  const snapshot = await db.collection("users").get();
  const writer = db.bulkWriter();

  let migrated = 0;

  snapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const isLegacySuperAdmin = data.role === "admin" && !data.managerId;
    const isLegacyAdmin = data.role === "user";

    if (isLegacySuperAdmin || isLegacyAdmin) {
      writer.update(docSnapshot.ref, { role: isLegacySuperAdmin ? "super_admin" : "admin" });
      migrated++;
    }
  });

  await writer.close();

  return { migrated, total: snapshot.docs.length };
});
