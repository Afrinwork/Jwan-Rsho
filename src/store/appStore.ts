import { create } from "zustand";

import { NavigationAppId } from "@/src/features/map/types/mapTypes";
import { AppLanguage } from "@/src/i18n/languageController";
import { ThemeMode } from "@/src/types/userPreferences";

export const defaultAppPreferences = {
  themeMode: "light" as ThemeMode,
  language: "ar" as AppLanguage,
  preferredNavigationApp: "apple-maps" as NavigationAppId,
  shopName: "",
  shareIncludeAddress: true,
  shareIncludePhone: false,
  shareIncludeTotals: true,
  whatsappSelectionTemplate: "Hallo,\n\nhier ist die Auswahl:",
};

type AppStore = {
  themeMode: ThemeMode;
  language: AppLanguage;
  preferredNavigationApp: NavigationAppId;
  shopName: string;
  shareIncludeAddress: boolean;
  shareIncludePhone: boolean;
  shareIncludeTotals: boolean;
  whatsappSelectionTemplate: string;
  setThemeMode: (value: ThemeMode) => void;
  setLanguage: (value: AppLanguage) => void;
  setPreferredNavigationApp: (value: NavigationAppId) => void;
  setShopName: (value: string) => void;
  resetPreferences: () => void;
  setShareOptions: (value: {
    shareIncludeAddress: boolean;
    shareIncludePhone: boolean;
    shareIncludeTotals: boolean;
  }) => void;
  setWhatsappSelectionTemplate: (value: string) => void;
  hydratePreferences: (value: {
    themeMode: ThemeMode;
    language: AppLanguage;
    preferredNavigationApp: NavigationAppId;
    shopName: string;
    shareIncludeAddress: boolean;
    shareIncludePhone: boolean;
    shareIncludeTotals: boolean;
    whatsappSelectionTemplate: string;
  }) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  ...defaultAppPreferences,
  setThemeMode: (value) => set({ themeMode: value }),
  setLanguage: (value) => set({ language: value }),
  setPreferredNavigationApp: (value) => set({ preferredNavigationApp: value }),
  setShopName: (value) => set({ shopName: value }),
  resetPreferences: () => set(defaultAppPreferences),
  setShareOptions: (value) => set(value),
  setWhatsappSelectionTemplate: (value) => set({ whatsappSelectionTemplate: value }),
  hydratePreferences: (value) => set(value),
}));
