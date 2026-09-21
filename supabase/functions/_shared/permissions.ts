import type { CallerRole } from "./auth.ts";

// Mirrors src/features/auth/permissions.ts and functions/src/shared/permissions.ts.
// No legacy-role bridging needed here -- role normalization happened once
// during the Stage 7 data migration, not on every read.

export function canCreateRole(actorRole: CallerRole, targetRole: CallerRole): boolean {
  if (actorRole === "super_admin") return targetRole === "admin" || targetRole === "driver";
  if (actorRole === "admin") return targetRole === "driver";
  return false;
}

export function canDeleteUser(
  actor: { id: string; role: CallerRole },
  target: { id: string; role: CallerRole; managerId: string | null },
): boolean {
  if (actor.id === target.id) return false;
  if (actor.role === "super_admin") return target.role === "admin" || target.role === "driver";
  if (actor.role === "admin") return target.role === "driver" && target.managerId === actor.id;
  return false;
}
