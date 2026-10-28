import * as Linking from "expo-linking";

import { buildWhatsappSendUrl } from "@/src/services/phoneService.shared";
import { WhatsappApp } from "@/src/services/whatsappService.shared";

export const whatsappService = {
  // iOS offers no way to pick WhatsApp Business over WhatsApp: both answer
  // the same link, and the system opens the one it links to.
  async openChat(_app: WhatsappApp, phoneNumber: string, text: string) {
    try {
      await Linking.openURL(buildWhatsappSendUrl(phoneNumber, text));
    } catch {
      throw new Error("WhatsApp konnte nicht geoeffnet werden.");
    }
  },
};
