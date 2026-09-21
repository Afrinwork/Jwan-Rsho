import { errorResponse, getAdminClient, HttpError, jsonResponse, requireAdminOrSuperAdmin } from "../_shared/auth.ts";
import { resolveManageableTarget } from "../_shared/userTargeting.ts";

// Replaces functions/src/admin/deleteUser.ts. Much simpler than the
// Firestore version: every owner-scoped table has ON DELETE CASCADE back
// to profiles(id), and profiles(id) cascades from auth.users(id), so one
// auth.admin.deleteUser call removes everything -- no manual per-table
// cascade helper needed.
Deno.serve(async (req) => {
  try {
    const caller = await requireAdminOrSuperAdmin(req);
    const { email } = await req.json() as { email: string };
    if (!email) throw new HttpError(400, "invalid-argument");

    const { authUser } = await resolveManageableTarget(caller, email);

    const admin = getAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(authUser.id);
    if (deleteError) throw new HttpError(500, "internal");

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
