import { errorResponse, getAdminClient, HttpError, jsonResponse, requireCallerProfile } from "../_shared/auth.ts";

// Replaces functions/src/account/deleteOwnAccount.ts. Self-service only
// -- requireCallerProfile, not requireAdminOrSuperAdmin. Same cascade as
// delete-user, just always targeting the caller themself.
Deno.serve(async (req) => {
  try {
    const caller = await requireCallerProfile(req);

    const admin = getAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(caller.id);
    if (deleteError) throw new HttpError(500, "internal");

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
