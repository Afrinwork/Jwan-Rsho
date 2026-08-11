import * as Linking from "expo-linking";

import { buildMailtoUrl } from "@/src/services/emailService.shared";

export const emailService = {
  async compose(subject: string, body: string) {
    try {
      return await Linking.openURL(buildMailtoUrl(subject, body));
    } catch {
      throw new Error("E-Mail kann auf diesem Geraet nicht geoeffnet werden.");
    }
  },
};
