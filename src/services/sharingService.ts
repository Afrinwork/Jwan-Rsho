import * as Linking from "expo-linking";
import { Share } from "react-native";

import { buildCustomerLocationMessage } from "@/src/services/sharingService.shared";

type WhatsappShareEntry = {
  message: string;
  phone?: string;
};

export const sharingService = {
  async shareText(message: string) {
    return Share.share({ message });
  },
  async shareTextViaWhatsApp(message: string, phoneNumber?: string) {
    const encodedMessage = encodeURIComponent(message);
    const normalizedPhone = normalizeWhatsappPhone(phoneNumber);
    const appUrl = normalizedPhone
      ? `whatsapp://send?phone=${normalizedPhone}&text=${encodedMessage}`
      : `whatsapp://send?text=${encodedMessage}`;
    const webUrl = normalizedPhone
      ? `https://wa.me/${normalizedPhone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;

    try {
      const canOpenAppUrl = await Linking.canOpenURL(appUrl);
      if (canOpenAppUrl) {
        return await Linking.openURL(appUrl);
      }

      return await Linking.openURL(webUrl);
    } catch {
      throw new Error("WhatsApp kann auf diesem Geraet nicht geoeffnet werden.");
    }
  },
  async shareTextsViaWhatsApp(entries: WhatsappShareEntry[]) {
    const preparedEntries = entries.filter((entry) => entry.message.trim());

    if (!preparedEntries.length) {
      return;
    }

    for (const entry of preparedEntries) {
      await this.shareTextViaWhatsApp(entry.message, entry.phone);
      await wait(350);
    }
  },
  buildCustomerLocationMessage,
};

function normalizeWhatsappPhone(phoneNumber?: string) {
  if (!phoneNumber) {
    return "";
  }

  return phoneNumber.replace(/[^\d]/g, "");
}

function wait(durationMs: number) {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}
