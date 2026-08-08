import { useEffect } from "react";

import { authRepository } from "@/src/repositories/authRepository";
import { userRepository } from "@/src/repositories/userRepository";
import { useAuthStore } from "@/src/store/authStore";
import { formatError } from "@/src/utils/formatError";

export function useAuthSession() {
  const {
    currentUser,
    authLoading,
    authError,
    isAdmin,
    setUser,
    clearUser,
    setAuthLoading,
    setAuthError,
  } = useAuthStore();

  useEffect(() => {
    setAuthLoading(true);
    const unsubscribe = authRepository.observeAuth(async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          clearUser();
          setAuthError(null);
          setAuthLoading(false);
          return;
        }

        const profile = await userRepository.getUserProfile(firebaseUser.uid);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: profile?.fullName ?? firebaseUser.displayName,
          role: profile?.role ?? "user",
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
    isAdmin,
    isAuthenticated: Boolean(currentUser),
  };
}
