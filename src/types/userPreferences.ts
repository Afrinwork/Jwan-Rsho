import { NavigationAppId } from "@/src/features/map/types/mapTypes";
import { AppLanguage } from "@/src/i18n/languageController";

export type ThemeMode = "system" | "light" | "dark";

// The building blocks that can be switched on/off in the WhatsApp selection
// message's per-customer block -- see mapShareFormatterService.ts for how
// each one renders.
export type WhatsappMessageComponent = "name" | "address" | "phone" | "orders" | "thankYou" | "eta";

export const DEFAULT_WHATSAPP_COMPONENTS: WhatsappMessageComponent[] = ["name", "address", "phone", "orders", "thankYou"];

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
  // Two independent intro texts -- whichever matches the SENDER's own
  // current app language is used when sharing (not the recipient's).
  whatsappTemplateDe?: string;
  whatsappTemplateAr?: string;
  whatsappComponents?: WhatsappMessageComponent[];
  createdAt: string;
  updatedAt: string;
};
