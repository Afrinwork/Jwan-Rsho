// Normal WhatsApp or WhatsApp Business — the person may have a different
// number on each and picks which one the messages come from.
export type WhatsappApp = "whatsapp" | "business";

export const WHATSAPP_ANDROID_PACKAGE: Record<WhatsappApp, string> = {
  whatsapp: "com.whatsapp",
  business: "com.whatsapp.w4b",
};
