import { NavigationAppId } from "@/src/features/map/types/mapTypes";
import { SupportedLanguage } from "@/src/i18n/i18n";

export type ThemeMode = "system" | "light" | "dark";

export type UserPreferences = {
  id: string;
  ownerId: string;
  themeMode: ThemeMode;
  language: SupportedLanguage;
  preferredNavigationApp: NavigationAppId;
  shopName: string;
  shareIncludeAddress: boolean;
  shareIncludePhone: boolean;
  shareIncludeTotals: boolean;
  createdAt: string;
  updatedAt: string;
};
