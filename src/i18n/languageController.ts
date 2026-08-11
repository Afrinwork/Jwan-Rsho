import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";
import * as Updates from "expo-updates";

import { i18next, isRTLLanguage, SupportedLanguage } from "@/src/i18n/i18n";

const LANGUAGE_STORAGE_KEY = "app_language";

export async function getCachedLanguage(): Promise<SupportedLanguage | null> {
  const value = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  return value === "de" || value === "ar" ? value : null;
}

async function cacheLanguage(language: SupportedLanguage) {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function needsRestartForLanguage(language: SupportedLanguage) {
  return isRTLLanguage(language) !== I18nManager.isRTL;
}

async function reload() {
  if (Updates.isEnabled) {
    await Updates.reloadAsync();
    return;
  }

  // Dev-client without an active Updates runtime (e.g. Expo Go-style local dev):
  // Metro's Fast Refresh will not fully re-evaluate native I18nManager state,
  // so a manual reload from the developer menu is required in that case.
}

/**
 * Applies a language selection: caches it, switches i18next immediately, and — since
 * "de" and "ar" always differ in text direction — flips native RTL and reloads the app
 * so I18nManager's mirrored layout takes effect.
 */
export async function applyLanguage(language: SupportedLanguage) {
  await cacheLanguage(language);
  await i18next.changeLanguage(language);

  if (needsRestartForLanguage(language)) {
    const isRTL = isRTLLanguage(language);
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    await reload();
  }
}

/**
 * Called on cold start once the persisted preference (Firestore or local cache) is known,
 * to self-heal a mismatch between native RTL state and the stored language — e.g. a fresh
 * login on a new device that has never applied this user's language before.
 */
export async function syncLanguageOnHydrate(language: SupportedLanguage) {
  await cacheLanguage(language);

  if (i18next.language !== language) {
    await i18next.changeLanguage(language);
  }

  if (needsRestartForLanguage(language)) {
    const isRTL = isRTLLanguage(language);
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    await reload();
  }
}
