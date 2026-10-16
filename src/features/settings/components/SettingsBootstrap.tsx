import { useEffect } from "react";

import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useUserPreferences } from "@/src/features/settings/hooks/useUserPreferences";
import { i18next } from "@/src/i18n/i18n";
import { useAppStore } from "@/src/store/appStore";

export function SettingsBootstrap() {
  const user = useCurrentUser();

  useUserPreferences();

  // bootstrapLanguage restores the saved language asynchronously at start,
  // so the store mirrors i18next instead of guessing it once.
  useEffect(() => {
    const syncStore = (language: string) => useAppStore.getState().setLanguage(language === "de" ? "de" : "ar");
    syncStore(i18next.language);
    i18next.on("languageChanged", syncStore);
    return () => {
      i18next.off("languageChanged", syncStore);
    };
  }, []);

  if (!user) {
    return null;
  }

  return null;
}
