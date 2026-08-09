import * as Linking from "expo-linking";
import { buildPhoneUrl } from "@/src/services/phoneService.shared";

export const phoneService = {
  async call(phoneNumber: string) {
    const url = buildPhoneUrl(phoneNumber);
    const promptUrl = buildPhonePromptUrl(phoneNumber);

    try {
      return await Linking.openURL(url);
    } catch {
      if (promptUrl) {
        try {
          return await Linking.openURL(promptUrl);
        } catch {
          throw new Error("Anrufe koennen auf diesem Geraet nicht gestartet werden.");
        }
      }

      throw new Error("Anrufe koennen auf diesem Geraet nicht gestartet werden.");
    }
  },
};

function buildPhonePromptUrl(phoneNumber: string) {
  const normalized = phoneNumber.replace(/[^\d+]/g, "");
  return normalized ? `telprompt:${normalized}` : null;
}
