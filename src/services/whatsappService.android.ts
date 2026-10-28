import * as IntentLauncher from "expo-intent-launcher";

import { buildWhatsappSendUrl } from "@/src/services/phoneService.shared";
import { WHATSAPP_ANDROID_PACKAGE, WhatsappApp } from "@/src/services/whatsappService.shared";

// Long enough for "app not installed" to come back; an opened chat only
// resolves once the person returns, which is never this fast.
const OPEN_FAILURE_WINDOW_MS = 1000;

export const whatsappService = {
  // Android: the intent names the app's package, so exactly the chosen
  // WhatsApp (normal or Business) opens.
  async openChat(app: WhatsappApp, phoneNumber: string, text: string) {
    const started = IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: buildWhatsappSendUrl(phoneNumber, text),
      packageName: WHATSAPP_ANDROID_PACKAGE[app],
    });
    const failed = await Promise.race([
      started.then(
        () => false,
        () => true,
      ),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), OPEN_FAILURE_WINDOW_MS)),
    ]);
    if (failed) throw new Error("WhatsApp konnte nicht geoeffnet werden.");
  },
};
