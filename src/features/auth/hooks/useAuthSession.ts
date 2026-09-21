import { useEffect } from "react";

import { canAccessFullApp, isDriver, isSuperAdmin, normalizeLegacyRole } from "@/src/features/auth/permissions";
import { authRepository } from "@/src/repositories/authRepository";
import { userRepository } from "@/src/repositories/userRepository";
import { useAuthStore } from "@/src/store/authStore";
import { formatError } from "@/src/utils/formatError";

export function useAuthSession() {
  const {
    currentUser,
    authLoading,
    authError,
    setUser,
    clearUser,
    setAuthLoading,
    setAuthError,
  } = useAuthStore();

  useEffect(() => {
    setAuthLoading(true);
    // observeAuth's callback is already a backend-agnostic AuthUser --
    // any backend-specific race (e.g. Firebase's ID-token-attachment
    // race) is handled inside that backend's own authRepository, not
    // here, so this hook doesn't need to know which backend is active.
    const unsubscribe = authRepository.observeAuth(async (authUser) => {
      try {
        if (!authUser) {
          clearUser();
          setAuthError(null);
          setAuthLoading(false);
          return;
        }

        const profile = await userRepository.getUserProfile(authUser.uid);
        setUser({
          uid: authUser.uid,
          email: authUser.email,
          displayName: profile?.fullName ?? authUser.displayName,
          role: normalizeLegacyRole(profile?.role, profile?.managerId),
          managerId: profile?.managerId,
        });
        setAuthError(null);
      } catch (error) {
        clearUser();
        setAuthError(formatError(error).message);
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, [clearUser, setAuthError, setAuthLoading, setUser]);

  return {
    currentUser,
    authLoading,
    authError,
    isAuthenticated: Boolean(currentUser),
    isSuperAdmin: isSuperAdmin(currentUser),
    isDriver: isDriver(currentUser),
    canAccessFullApp: canAccessFullApp(currentUser),
  };
}
