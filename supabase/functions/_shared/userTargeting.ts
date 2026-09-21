import { getAdminClient, HttpError, type CallerProfile, type CallerRole } from "./auth.ts";
import { canDeleteUser } from "./permissions.ts";

// Mirrors functions/src/shared/userTargeting.ts's resolveManageableTarget:
// look up the target by email, block self-targeting, load its profile,
// authorize via canDeleteUser (shared by delete/deactivate/update actions).
export async function resolveManageableTarget(caller: CallerProfile, email: string) {
  const admin = getAdminClient();

  const { data: profileRow, error: profileError } = await admin
    .from("profiles")
    .select("id, role, manager_id, is_active, email, full_name")
    .eq("email", email)
    .maybeSingle();
  if (profileError) throw new HttpError(500, "internal");
  if (!profileRow) throw new HttpError(404, "not-found");

  if (profileRow.id === caller.id) throw new HttpError(400, "cannot-target-self");

  const target = {
    id: profileRow.id as string,
    role: profileRow.role as CallerRole,
    managerId: profileRow.manager_id as string | null,
  };
  if (!canDeleteUser(caller, target)) throw new HttpError(403, "permission-denied");

  const { data: authUserData, error: authError } = await admin.auth.admin.getUserById(profileRow.id);
  if (authError || !authUserData?.user) throw new HttpError(404, "not-found");

  return { profile: profileRow, authUser: authUserData.user };
}
