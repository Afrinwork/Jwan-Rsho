import { NavigationAppId } from "@/src/features/map/types/mapTypes";

export type ThemeMode = "system" | "light" | "dark";

export type UserPreferences = {
  id: string;
  ownerId: string;
  themeMode: ThemeMode;
  preferredNavigationApp: NavigationAppId;
  shareIncludeAddress: boolean;
  shareIncludePhone: boolean;
  shareIncludeTotals: boolean;
  createdAt: string;
  updatedAt: string;
};
