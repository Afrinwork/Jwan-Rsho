import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";
import * as Updates from "expo-updates";

import { i18next } from "@/src/i18n/i18n";

export type AppLanguage = "ar" | "de";

const LANGUAGE_STORAGE_KEY = "app:language";

function isRTLLanguage(language: AppLanguage) {
  return language === "ar";
}

async function reconcileNativeRTL(language: AppLanguage) {
  const shouldBeRTL = isRTLLanguage(language);

  if (I18nManager.isRTL === shouldBeRTL) {
    return;
  }

  I18nManager.allowRTL(shouldBeRTL);
  I18nManager.forceRTL(shouldBeRTL);

  try {
    if (Updates.isEnabled) {
      await Updates.reloadAsync();
    }
  } catch {
    // expo-updates has limited/no support in Expo Go — the native RTL flag
    // is already flipped and will take effect on the next natural reload.
  }
}

// Runs once at app start, before the first screen renders: applies the
// last-used language (cached locally so it is available before any Firestore
// round trip) and makes sure the native RTL flag matches it.
export async function bootstrapLanguage() {
  let stored: string | null = null;

  try {
    stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    // Local storage can be unavailable in rare sandboxed environments; fall
    // back to the Arabic default below.
  }

  const language: AppLanguage = stored === "de" ? "de" : "ar";

  if (i18next.language !== language) {
    await i18next.changeLanguage(language);
  }

  await reconcileNativeRTL(language);
}

// Switches the app to `language`: updates i18next immediately (all text
// re-renders without a reload) and caches the choice locally. If the
// language's writing direction differs from the current native RTL flag,
// also flips that flag and reloads the app — React Native only picks up
// RTL/LTR changes on a fresh native start.
export async function applyLanguage(language: AppLanguage) {
  await i18next.changeLanguage(language);

  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Best-effort local cache; the Firestore-backed user preference is the
    // source of truth once the user is signed in and saves settings.
  }

  await reconcileNativeRTL(language);
}
