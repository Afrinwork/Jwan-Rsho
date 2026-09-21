import { UserRole } from "@/src/types/user";

type RoleCarrier = { role: UserRole; managerId?: string } | null | undefined;

type DeletableUser = { id: string; role: UserRole; managerId?: string };

type DeletingUser = { uid: string; role: UserRole } | null | undefined;

// Bridges the legacy 2-role model ("admin" | "user") to the new 3-role model.
// Only ever read at the boundary where a raw Firestore role string first
// enters the app (client: useAuthSession; server: requireCallerRole) — every
// other consumer only ever sees the three canonical roles. A legacy "admin"
// with no managerId is an old full-admin account (-> super_admin); a legacy
// "admin" WITH a managerId is a real new-model admin created by a
// super_admin and must not be over-granted. "user" never had a managerId and
// always becomes "admin" (old accounts kept their full self-scoped access
// under the new name, rather than losing it by becoming "driver").
// Remove this once the one-time migration has been confirmed run in
// production and no unmigrated docs remain — see the Stage 1 plan for why
// this exact check (not a blanket "admin" -> "super_admin" rename) is
// required for a safe, deploy-order-independent rollout.
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

export function isSuperAdmin(user: RoleCarrier) {
  return user?.role === "super_admin";
}

export function isAdmin(user: RoleCarrier) {
  return user?.role === "admin";
}

export function isDriver(user: RoleCarrier) {
  return user?.role === "driver";
}

export function canAccessFullApp(user: RoleCarrier) {
  return isSuperAdmin(user) || isAdmin(user);
}

export function canManageAdmins(user: RoleCarrier) {
  return isSuperAdmin(user);
}

export function canManageDrivers(user: RoleCarrier) {
  return isSuperAdmin(user) || isAdmin(user);
}

export function canCreateRole(actor: RoleCarrier, targetRole: UserRole) {
  if (isSuperAdmin(actor)) {
    return targetRole === "admin" || targetRole === "driver";
  }

  if (isAdmin(actor)) {
    return targetRole === "driver";
  }

  return false;
}

export function canDeleteUser(actor: DeletingUser, target: DeletableUser | null | undefined) {
  if (!actor || !target) {
    return false;
  }

  if (actor.uid === target.id) {
    return false;
  }

  if (isSuperAdmin(actor)) {
    return target.role === "admin" || target.role === "driver";
  }

  if (isAdmin(actor)) {
    return target.role === "driver" && target.managerId === actor.uid;
  }

  return false;
}
