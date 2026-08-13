import { create } from "zustand";

import { NavigationAppId } from "@/src/features/map/types/mapTypes";
import { ThemeMode } from "@/src/types/userPreferences";

export const defaultAppPreferences = {
  themeMode: "light" as ThemeMode,
  preferredNavigationApp: "apple-maps" as NavigationAppId,
  shopName: "",
  shareIncludeAddress: true,
  shareIncludePhone: false,
  shareIncludeTotals: true,
};

type AppStore = {
  themeMode: ThemeMode;
  preferredNavigationApp: NavigationAppId;
  shopName: string;
  shareIncludeAddress: boolean;
  shareIncludePhone: boolean;
  shareIncludeTotals: boolean;
  setThemeMode: (value: ThemeMode) => void;
  setPreferredNavigationApp: (value: NavigationAppId) => void;
  setShopName: (value: string) => void;
  resetPreferences: () => void;
  setShareOptions: (value: {
    shareIncludeAddress: boolean;
    shareIncludePhone: boolean;
    shareIncludeTotals: boolean;
  }) => void;
  hydratePreferences: (value: {
    themeMode: ThemeMode;
    preferredNavigationApp: NavigationAppId;
    shopName: string;
    shareIncludeAddress: boolean;
    shareIncludePhone: boolean;
    shareIncludeTotals: boolean;
  }) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  ...defaultAppPreferences,
  setThemeMode: (value) => set({ themeMode: value }),
  setPreferredNavigationApp: (value) => set({ preferredNavigationApp: value }),
  setShopName: (value) => set({ shopName: value }),
  resetPreferences: () => set(defaultAppPreferences),
  setShareOptions: (value) => set(value),
  hydratePreferences: (value) => set(value),
}));
