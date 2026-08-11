import { useCallback, useEffect, useState } from "react";

import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { getCachedLanguage, syncLanguageOnHydrate } from "@/src/i18n/languageController";
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
          language: preferences.language ?? "de",
          preferredNavigationApp: preferences.preferredNavigationApp,
          shopName: preferences.shopName ?? "",
          shareIncludeAddress: preferences.shareIncludeAddress,
          shareIncludePhone: preferences.shareIncludePhone,
          shareIncludeTotals: preferences.shareIncludeTotals,
        });
        await syncLanguageOnHydrate(preferences.language ?? "de");
      } else {
        resetPreferences();
      }

      setError(null);
    } catch (value) {
      const formatted = formatError(value);

      // The Auth session can still be restoring from storage right after app start;
      // that is an expected transitional state, not a real error to show the user.
      if (formatted.code === "auth/unauthenticated") {
        resetPreferences();
      } else {
        setError(formatted.message);
      }
    } finally {
      setLoading(false);
    }
  }, [hydratePreferences, resetPreferences, user]);

  // Applies the last-known cached language immediately on cold start (before the
  // slower Firestore-backed load() below resolves), so I18nManager's RTL state is
  // correct as early as possible while the StartupSplash overlay is still visible.
  useEffect(() => {
    void getCachedLanguage().then((cached) => {
      if (cached) {
        void syncLanguageOnHydrate(cached);
      }
    });
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [load]);

  return { loading, error, reload: load };
}
