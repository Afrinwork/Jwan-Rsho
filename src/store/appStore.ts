import { create } from "zustand";

import { NavigationAppId } from "@/src/features/map/types/mapTypes";
import { AppLanguage } from "@/src/i18n/languageController";
import { DEFAULT_WHATSAPP_COMPONENTS, ThemeMode, WhatsappMessageComponent } from "@/src/types/userPreferences";

export const defaultAppPreferences = {
  themeMode: "light" as ThemeMode,
  language: "ar" as AppLanguage,
  preferredNavigationApp: "apple-maps" as NavigationAppId,
  shopName: "",
  shareIncludeAddress: true,
  shareIncludePhone: false,
  shareIncludeTotals: true,
  whatsappTemplateDe: "Hallo,\n\nhier ist die Auswahl:",
  whatsappTemplateAr: "مرحباً،\n\nهذه هي القائمة:",
  whatsappComponents: DEFAULT_WHATSAPP_COMPONENTS,
};

type AppStore = {
  themeMode: ThemeMode;
  language: AppLanguage;
  preferredNavigationApp: NavigationAppId;
  shopName: string;
  shareIncludeAddress: boolean;
  shareIncludePhone: boolean;
  shareIncludeTotals: boolean;
  whatsappTemplateDe: string;
  whatsappTemplateAr: string;
  whatsappComponents: WhatsappMessageComponent[];
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
  setWhatsappTemplateDe: (value: string) => void;
  setWhatsappTemplateAr: (value: string) => void;
  setWhatsappComponents: (value: WhatsappMessageComponent[]) => void;
  hydratePreferences: (value: {
    themeMode: ThemeMode;
    language: AppLanguage;
    preferredNavigationApp: NavigationAppId;
    shopName: string;
    shareIncludeAddress: boolean;
    shareIncludePhone: boolean;
    shareIncludeTotals: boolean;
    whatsappTemplateDe: string;
    whatsappTemplateAr: string;
    whatsappComponents: WhatsappMessageComponent[];
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
  setWhatsappTemplateDe: (value) => set({ whatsappTemplateDe: value }),
  setWhatsappTemplateAr: (value) => set({ whatsappTemplateAr: value }),
  setWhatsappComponents: (value) => set({ whatsappComponents: value }),
  hydratePreferences: (value) => set(value),
}));
