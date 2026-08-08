import * as Linking from "expo-linking";
import { buildPhoneUrl } from "@/src/services/phoneService.shared";

export const phoneService = {
  async call(phoneNumber: string) {
    const url = buildPhoneUrl(phoneNumber);
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      throw new Error("Anrufe koennen auf diesem Geraet nicht gestartet werden.");
    }

    return Linking.openURL(url);
  },
};
