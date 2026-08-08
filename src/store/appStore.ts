import { create } from "zustand";

import { NavigationAppId } from "@/src/features/map/types/mapTypes";
import { ThemeMode } from "@/src/types/userPreferences";

export const defaultAppPreferences = {
  themeMode: "system" as ThemeMode,
  preferredNavigationApp: "apple-maps" as NavigationAppId,
  shareIncludeAddress: true,
  shareIncludePhone: false,
  shareIncludeTotals: true,
};

type AppStore = {
  themeMode: ThemeMode;
  preferredNavigationApp: NavigationAppId;
  shareIncludeAddress: boolean;
  shareIncludePhone: boolean;
  shareIncludeTotals: boolean;
  setThemeMode: (value: ThemeMode) => void;
  setPreferredNavigationApp: (value: NavigationAppId) => void;
  resetPreferences: () => void;
  setShareOptions: (value: {
    shareIncludeAddress: boolean;
    shareIncludePhone: boolean;
    shareIncludeTotals: boolean;
  }) => void;
  hydratePreferences: (value: {
    themeMode: ThemeMode;
    preferredNavigationApp: NavigationAppId;
    shareIncludeAddress: boolean;
    shareIncludePhone: boolean;
    shareIncludeTotals: boolean;
  }) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  ...defaultAppPreferences,
  setThemeMode: (value) => set({ themeMode: value }),
  setPreferredNavigationApp: (value) => set({ preferredNavigationApp: value }),
  resetPreferences: () => set(defaultAppPreferences),
  setShareOptions: (value) => set(value),
  hydratePreferences: (value) => set(value),
}));
