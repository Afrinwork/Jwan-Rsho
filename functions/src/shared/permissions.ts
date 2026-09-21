export type UserRole = "super_admin" | "admin" | "driver";

// Server-side mirror of src/features/auth/permissions.ts's normalizeLegacyRole.
// functions/ is a fully isolated TS project (its own tsconfig baseUrl/include)
// and cannot import from the app's src/ — this logic must stay duplicated,
// not aliased. Keep both copies in sync by hand; see the Stage 1 plan for why
// this exact rule (not a blanket "admin" -> "super_admin" rename) is required
// for a safe, deploy-order-independent rollout. Remove once the one-time
// migration has been confirmed run in production and no unmigrated docs
// remain.
export function normalizeLegacyRole(rawRole: string | undefined, managerId: string | undefined): UserRole {
  if (rawRole === "admin" && !managerId) {
    return "super_admin";
  }

  if (rawRole === "user") {
    return "admin";
  }

  if (rawRole === "super_admin" || rawRole === "admin" || rawRole === "driver") {
    return rawRole;
  }

  return "admin";
}

export function canCreateRole(actorRole: UserRole, targetRole: UserRole) {
  if (actorRole === "super_admin") {
    return targetRole === "admin" || targetRole === "driver";
  }

  if (actorRole === "admin") {
    return targetRole === "driver";
  }

  return false;
}

type DeletingUser = { uid: string; role: UserRole };
type DeletableUser = { id: string; role: UserRole; managerId?: string };

export function canDeleteUser(actor: DeletingUser, target: DeletableUser) {
  if (actor.uid === target.id) {
    return false;
  }

  if (actor.role === "super_admin") {
    return target.role === "admin" || target.role === "driver";
  }

  if (actor.role === "admin") {
    return target.role === "driver" && target.managerId === actor.uid;
  }

  return false;
}
