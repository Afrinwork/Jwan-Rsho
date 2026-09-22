import { useCallback, useEffect, useState } from "react";

import { AppError } from "@/src/errors/AppError";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { applyLanguage, AppLanguage } from "@/src/i18n/languageController";
import { i18next } from "@/src/i18n/i18n";
import { defaultAppPreferences, useAppStore } from "@/src/store/appStore";
import { userPreferencesRepository } from "@/src/repositories/userPreferencesRepository";
import { formatError } from "@/src/utils/formatError";

// Keeps the actually-rendered app language (i18next + native RTL flag) in
// sync with `language` — a no-op when it already matches, so this never
// forces an unnecessary reload.
function syncLanguage(language: AppLanguage) {
  if (language !== i18next.language) {
    void applyLanguage(language);
  }
}

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
      // A signed-out device (e.g. after logout on a shared device) has no
      // user-specific language anymore — fall back to the app default
      // instead of leaving whatever language the previous session left on.
      syncLanguage(defaultAppPreferences.language);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      const preferences = await userPreferencesRepository.getPreferences();

      if (preferences) {
        const language = preferences.language ?? "ar";
        hydratePreferences({
          themeMode: preferences.themeMode,
          language,
          preferredNavigationApp: preferences.preferredNavigationApp,
          shopName: preferences.shopName ?? "",
          shareIncludeAddress: preferences.shareIncludeAddress,
          shareIncludePhone: preferences.shareIncludePhone,
          shareIncludeTotals: preferences.shareIncludeTotals,
          whatsappTemplateDe: preferences.whatsappTemplateDe ?? defaultAppPreferences.whatsappTemplateDe,
          whatsappTemplateAr: preferences.whatsappTemplateAr ?? defaultAppPreferences.whatsappTemplateAr,
          whatsappComponents: preferences.whatsappComponents ?? defaultAppPreferences.whatsappComponents,
        });

        // Keeps this device in sync with a language chosen on another
        // device.
        syncLanguage(language);
      } else {
        resetPreferences();
        syncLanguage(defaultAppPreferences.language);
      }

      setError(null);
    } catch (value) {
      // The Auth session can still be restoring from storage right after app start;
      // that is an expected transitional state, not a real error, so it's handled
      // here without going through formatError()'s (noisy, dev-only) console.error.
      if (value instanceof AppError && value.code === "auth/unauthenticated") {
        resetPreferences();
        syncLanguage(defaultAppPreferences.language);
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
