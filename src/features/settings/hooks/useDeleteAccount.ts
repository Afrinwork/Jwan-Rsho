import { useState } from "react";

import { authService } from "@/src/features/auth/services/authService";
import { accountDeletionService } from "@/src/features/settings/services/accountDeletionService";
import { formatError } from "@/src/utils/formatError";

export function useDeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function requestDelete() {
    setError(null);
    setConfirming(true);
  }

  function cancelDelete() {
    setConfirming(false);
  }

  async function confirmDelete() {
    try {
      setLoading(true);
      setError(null);
      await accountDeletionService.deleteOwnAccount();
      await authService.logout();
      setConfirming(false);
    } catch (value) {
      setError(formatError(value).message);
    } finally {
      setLoading(false);
    }
  }

  return { confirming, loading, error, requestDelete, confirmDelete, cancelDelete };
}
