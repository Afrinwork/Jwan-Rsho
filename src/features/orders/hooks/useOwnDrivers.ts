import { useEffect, useState } from "react";

import { userRepository } from "@/src/repositories/userRepository";
import { UserProfile } from "@/src/types/user";
import { formatError } from "@/src/utils/formatError";

// The admin's own drivers for a driver picker (order form, customer edit).
// Loads nothing when the current user can't assign drivers.
export function useOwnDrivers(enabled: boolean) {
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(enabled);
  const [driversError, setDriversError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    userRepository
      .getOwnDrivers()
      .then((value) => {
        if (!cancelled) setDrivers(value);
      })
      .catch((error: unknown) => {
        if (!cancelled) setDriversError(formatError(error).message);
      })
      .finally(() => {
        if (!cancelled) setLoadingDrivers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { drivers, loadingDrivers, driversError };
}
