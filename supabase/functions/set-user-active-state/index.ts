import { errorResponse, getAdminClient, HttpError, jsonResponse, requireAdminOrSuperAdmin } from "../_shared/auth.ts";
import { resolveManageableTarget } from "../_shared/userTargeting.ts";

// Replaces functions/src/admin/setUserActiveState.ts.
//
// Supabase has no 1:1 equivalent to Firebase's disabled + revokeRefreshTokens
// pair. The closest match is auth.admin.updateUserById's `ban_duration`:
// a long duration (~100 years) to deactivate, "none" to reactivate. This
// was flagged in the migration plan as needing verification against the
// current supabase-js Admin API at build time -- confirmed against
// supabase-js v2 docs as of this implementation; re-check if the SDK
// version changes before relying on it in production.
const INDEFINITE_BAN = "876000h";

Deno.serve(async (req) => {
  try {
    const caller = await requireAdminOrSuperAdmin(req);
    const { email, isActive } = await req.json() as { email: string; isActive: boolean };
    if (!email || typeof isActive !== "boolean") throw new HttpError(400, "invalid-argument");

    const { authUser } = await resolveManageableTarget(caller, email);

    const admin = getAdminClient();
    const { error: banError } = await admin.auth.admin.updateUserById(authUser.id, {
      ban_duration: isActive ? "none" : INDEFINITE_BAN,
    });
    if (banError) throw new HttpError(500, "internal");

    const { error: updateError } = await admin
      .from("profiles")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", authUser.id);
    if (updateError) throw new HttpError(500, "internal");

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
