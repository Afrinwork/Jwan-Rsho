import { useCallback, useEffect, useState } from "react";

import { userRepository } from "@/src/repositories/userRepository";
import { UserProfile } from "@/src/types/user";
import { formatError } from "@/src/utils/formatError";

// Admins created by the current super_admin — no live open/completed stats
// here (unlike drivers, an admin runs their own independent business, so
// those numbers don't apply to them).
export function useOwnAdmins() {
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setAdmins(await userRepository.getOwnAdmins());
    } catch (loadError) {
      setError(formatError(loadError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadAdmins();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadAdmins]);

  return { admins, error, loading, reload: loadAdmins };
}
