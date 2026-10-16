import { useCallback, useEffect, useState } from "react";

import { AppError } from "@/src/errors/AppError";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { AppLanguage } from "@/src/i18n/languageController";
import { i18next } from "@/src/i18n/i18n";
import { defaultAppPreferences, useAppStore } from "@/src/store/appStore";
import { userPreferencesRepository } from "@/src/repositories/userPreferencesRepository";
import { formatError } from "@/src/utils/formatError";

// The language is a per-device choice (cached locally by applyLanguage and
// restored by bootstrapLanguage), so preferences never override it here --
// the store just mirrors whatever language the app is actually showing.
function currentLanguage(): AppLanguage {
  return i18next.language === "de" ? "de" : "ar";
}

function resetPreferencesKeepingLanguage(resetPreferences: () => void) {
  resetPreferences();
  useAppStore.getState().setLanguage(currentLanguage());
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
      resetPreferencesKeepingLanguage(resetPreferences);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      const preferences = await userPreferencesRepository.getPreferences();

      if (preferences) {
        hydratePreferences({
          themeMode: "light",
          language: currentLanguage(),
          preferredNavigationApp: preferences.preferredNavigationApp,
          shopName: preferences.shopName ?? "",
          shareIncludeAddress: preferences.shareIncludeAddress,
          shareIncludePhone: preferences.shareIncludePhone,
          shareIncludeTotals: preferences.shareIncludeTotals,
          whatsappTemplateDe: preferences.whatsappTemplateDe ?? defaultAppPreferences.whatsappTemplateDe,
          whatsappTemplateAr: preferences.whatsappTemplateAr ?? defaultAppPreferences.whatsappTemplateAr,
          whatsappComponents: preferences.whatsappComponents ?? defaultAppPreferences.whatsappComponents,
        });
      } else {
        resetPreferencesKeepingLanguage(resetPreferences);
      }

      setError(null);
    } catch (value) {
      // The Auth session can still be restoring from storage right after app start;
      // that is an expected transitional state, not a real error, so it's handled
      // here without going through formatError()'s (noisy, dev-only) console.error.
      if (value instanceof AppError && value.code === "auth/unauthenticated") {
        resetPreferencesKeepingLanguage(resetPreferences);
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
