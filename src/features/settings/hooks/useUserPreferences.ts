import { useCallback, useEffect, useState } from "react";

import { AppError } from "@/src/errors/AppError";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useAppStore } from "@/src/store/appStore";
import { userPreferencesRepository } from "@/src/repositories/userPreferencesRepository";
import { formatError } from "@/src/utils/formatError";

export function useUserPreferences() {
  const user = useCurrentUser();
  const hydratePreferences = useAppStore((state) => state.hydratePreferences);
  const resetPreferences = useAppStore((state) => state.resetPreferences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    if (!user) {
      resetPreferences();
      setError(null);
      setLoading(false);
      return;
    }

    try {
      const preferences = await userPreferencesRepository.getPreferences();

      if (preferences) {
        hydratePreferences({
          themeMode: preferences.themeMode,
          preferredNavigationApp: preferences.preferredNavigationApp,
          shopName: preferences.shopName ?? "",
          shareIncludeAddress: preferences.shareIncludeAddress,
          shareIncludePhone: preferences.shareIncludePhone,
          shareIncludeTotals: preferences.shareIncludeTotals,
        });
      } else {
        resetPreferences();
      }

      setError(null);
    } catch (value) {
      // The Auth session can still be restoring from storage right after app start;
      // that is an expected transitional state, not a real error, so it's handled
      // here without going through formatError()'s (noisy, dev-only) console.error.
      if (value instanceof AppError && value.code === "auth/unauthenticated") {
        resetPreferences();
      } else {
        setError(formatError(value).message);
      }
    } finally {
      setLoading(false);
    }
  }, [hydratePreferences, resetPreferences, user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [load]);

  return { loading, error, reload: load };
}
