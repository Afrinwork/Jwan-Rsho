import { NavigationAppId } from "@/src/features/map/types/mapTypes";
import { AppLanguage } from "@/src/i18n/languageController";

export type ThemeMode = "system" | "light" | "dark";

export type UserPreferences = {
  id: string;
  ownerId: string;
  themeMode: ThemeMode;
  language: AppLanguage;
  preferredNavigationApp: NavigationAppId;
  shopName: string;
  shareIncludeAddress: boolean;
  shareIncludePhone: boolean;
  shareIncludeTotals: boolean;
  whatsappSelectionTemplate?: string;
  createdAt: string;
  updatedAt: string;
};
