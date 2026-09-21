import { errorResponse, getAdminClient, HttpError, jsonResponse, requireAdminOrSuperAdmin } from "../_shared/auth.ts";
import { resolveManageableTarget } from "../_shared/userTargeting.ts";

// Replaces functions/src/admin/updateManagedUser.ts.
Deno.serve(async (req) => {
  try {
    const caller = await requireAdminOrSuperAdmin(req);
    const { email, fullName, newEmail } = await req.json() as {
      email: string;
      fullName?: string;
      newEmail?: string;
    };
    if (!email) throw new HttpError(400, "invalid-argument");

    const { authUser } = await resolveManageableTarget(caller, email);
    const admin = getAdminClient();

    const authUpdate: { email?: string; user_metadata?: Record<string, unknown> } = {};
    if (newEmail) authUpdate.email = newEmail;
    if (fullName) authUpdate.user_metadata = { ...authUser.user_metadata, full_name: fullName };

    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } = await admin.auth.admin.updateUserById(authUser.id, authUpdate);
      if (authError) {
        if (authError.message?.toLowerCase().includes("already been registered")) {
          throw new HttpError(409, "already-exists");
        }
        throw new HttpError(500, "internal");
      }
    }

    const profileUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (fullName) profileUpdate.full_name = fullName;
    if (newEmail) profileUpdate.email = newEmail;

    const { error: updateError } = await admin.from("profiles").update(profileUpdate).eq("id", authUser.id);
    if (updateError) throw new HttpError(500, "internal");

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
