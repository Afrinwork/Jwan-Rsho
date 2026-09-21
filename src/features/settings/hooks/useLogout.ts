import { useState } from "react";

import { authService } from "@/src/features/auth/services/authService";
import { useAuthStore } from "@/src/store/authStore";
import { useAppStore } from "@/src/store/appStore";
import { formatError } from "@/src/utils/formatError";

export function useLogout() {
  const clearUser = useAuthStore((state) => state.clearUser);
  const resetPreferences = useAppStore((state) => state.resetPreferences);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    try {
      setLoading(true);
      setError(null);
      await authService.logout();
      clearUser();
      resetPreferences();
    } catch (value) {
      setError(formatError(value).message);
    } finally {
      setLoading(false);
    }
  }

  return { logout, loading, error };
}
