import { errorResponse, getAdminClient, HttpError, jsonResponse, requireAdminOrSuperAdmin } from "../_shared/auth.ts";
import { canCreateRole } from "../_shared/permissions.ts";
import type { CallerRole } from "../_shared/auth.ts";

// Replaces functions/src/admin/createUser.ts.
Deno.serve(async (req) => {
  try {
    const caller = await requireAdminOrSuperAdmin(req);
    const { email, password, fullName, role } = await req.json() as {
      email: string;
      password: string;
      fullName: string;
      role: CallerRole;
    };

    if (!email || !password || !fullName || !role) {
      throw new HttpError(400, "invalid-argument");
    }
    if (!canCreateRole(caller.role, role)) {
      throw new HttpError(403, "permission-denied");
    }

    const admin = getAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createError || !created?.user) {
      throw new HttpError(400, createError?.message ?? "create-failed");
    }

    // managerId forced server-side to caller -- never trust a client-supplied value.
    const { error: insertError } = await admin.from("profiles").insert({
      id: created.user.id,
      email,
      full_name: fullName,
      role,
      manager_id: caller.id,
      is_active: true,
    });
    if (insertError) {
      // Roll back the auth user so we never leave an orphaned Auth account
      // with no matching profile row.
      await admin.auth.admin.deleteUser(created.user.id);
      throw new HttpError(500, "internal");
    }

    return jsonResponse({ uid: created.user.id });
  } catch (error) {
    return errorResponse(error);
  }
});

