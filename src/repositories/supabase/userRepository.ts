import { requireCurrentUserId, requireSupabase } from "@/src/repositories/supabase/repositoryContext";
import { UserProfile } from "@/src/types/user";
import type { Database } from "@/src/types/supabase";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function mapProfileRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role as UserProfile["role"],
    isActive: row.is_active,
    managerId: row.manager_id ?? undefined,
  };
}

export const userRepository = {
  async getUserProfile(uid: string) {
    const { data, error } = await requireSupabase().from("profiles").select("*").eq("id", uid).maybeSingle();
    if (error) throw error;
    return data ? mapProfileRow(data) : null;
  },

  async updateOwnProfile(input: { fullName: string; email?: string }) {
    const ownerId = requireCurrentUserId();
    const { error } = await requireSupabase()
      .from("profiles")
      .update({
        full_name: input.fullName.trim(),
        ...(input.email ? { email: input.email.trim().toLowerCase() } : {}),
      })
      .eq("id", ownerId);
    if (error) throw error;
  },

  // Drivers created by the current admin/super_admin. RLS only allows this
  // for a manager querying by their own uid (see supabase/migrations),
  // same guarantee as the Firestore rules version -- never leaks another
  // manager's drivers.
  async getOwnDrivers() {
    return getOwnUsersByRole("driver");
  },

  // Admins created by the current super_admin. Same manager-scoped RLS as
  // getOwnDrivers(); a plain admin's own query here comes back empty since
  // they never create other admins.
  async getOwnAdmins() {
    return getOwnUsersByRole("admin");
  },
};

async function getOwnUsersByRole(role: "admin" | "driver") {
  const managerId = requireCurrentUserId();
  const { data, error } = await requireSupabase()
    .from("profiles")
    .select("*")
    .eq("manager_id", managerId)
    .eq("role", role);
  if (error) throw error;

  const users = (data ?? []).map(mapProfileRow);
  return users.sort((left, right) => left.fullName.localeCompare(right.fullName, "de"));
}
