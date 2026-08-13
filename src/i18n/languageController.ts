import { I18nManager } from "react-native";
import * as Updates from "expo-updates";

/**
 * The app is Arabic-only (RTL) now, so there's no per-user language
 * preference anymore. This just makes sure the native RTL flag is set —
 * needed once for installs that were on an older, LTR/German build.
 */
export async function ensureArabicRTL() {
  if (I18nManager.isRTL) {
    return;
  }

  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);

  try {
    if (Updates.isEnabled) {
      await Updates.reloadAsync();
    }
  } catch {
    // expo-updates has limited/no support in Expo Go — I18nManager's native
    // flag is already flipped and will take effect on the next natural reload.
  }
}
