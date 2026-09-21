// Ported once, here, instead of as a deployed migrateLegacyRoles function
// (see migration plan Stage 2 -- "Nicht portiert" section). Runs exactly
// once, during the Stage 7 data migration, not on every read forever.
export type NormalizedRole = "super_admin" | "admin" | "driver";

export function normalizeLegacyRole(
  role: string | undefined,
  managerId: string | undefined | null,
): NormalizedRole {
  if (role === "admin" && !managerId) return "super_admin";
  if (role === "user") return "admin";
  if (role === "super_admin" || role === "admin" || role === "driver") return role;
  throw new Error(`Unrecognized legacy role "${role}" (managerId=${managerId ?? "null"})`);
}
