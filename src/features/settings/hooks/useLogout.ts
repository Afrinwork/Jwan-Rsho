import { useState } from "react";

import { authService } from "@/src/features/auth/services/authService";
import { formatError } from "@/src/utils/formatError";

export function useLogout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    try {
      setLoading(true);
      setError(null);
      await authService.logout();
    } catch (value) {
      setError(formatError(value).message);
    } finally {
      setLoading(false);
    }
  }

  return { logout, loading, error };
}
