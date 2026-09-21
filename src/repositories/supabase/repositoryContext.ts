import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";
import { supabase } from "@/src/supabase/client";
import { useAuthStore } from "@/src/store/authStore";

export function requireSupabase() {
  if (!supabase) {
    throw new AppError(errorMessages.backendNotConfigured);
  }

  return supabase;
}

// Supabase's client has no synchronous "currentUser" accessor the way
// Firebase Auth does (auth.getSession() is async, resolved from an
// in-memory cache under the hood but still Promise-based). Reading from
// useAuthStore instead of the SDK keeps this synchronous and matches
// resolveOwnerScope() below, which already worked this way even under
// Firebase -- useAuthStore is kept in sync by useAuthSession's
// onAuthStateChange listener regardless of which backend is behind it.
export function requireCurrentUserId() {
  const uid = useAuthStore.getState().currentUser?.uid;

  if (!uid) {
    throw new AppError(errorMessages.authRequired, "auth/unauthenticated");
  }

  return uid;
}

export type OwnerScope = {
  ownerId: string;
  driverId?: string;
};

// Identical logic to the Firebase version -- customer/order data belongs
// to a super_admin or admin (ownerId == their own uid). A driver never
// owns data, only sees their manager's data assigned to them, so
// ownerId resolves to their manager's uid instead of their own.
export function resolveOwnerScope(): OwnerScope {
  const user = useAuthStore.getState().currentUser;

  if (!user) {
    throw new AppError(errorMessages.authRequired, "auth/unauthenticated");
  }

  if (user.role === "driver") {
    if (!user.managerId) {
      throw new AppError(errorMessages.authRequired, "auth/invalid-role-config");
    }

    return { ownerId: user.managerId, driverId: user.uid };
  }

  return { ownerId: user.uid };
}
