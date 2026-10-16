import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { authService } from "@/src/features/auth/services/authService";
import { NavigationAppId } from "@/src/features/map/types/mapTypes";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { applyLanguage, AppLanguage } from "@/src/i18n/languageController";
import { useAuthStore } from "@/src/store/authStore";
import { useAppStore } from "@/src/store/appStore";
import { customerRepository } from "@/src/repositories/customerRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { userPreferencesRepository } from "@/src/repositories/userPreferencesRepository";
import { userRepository } from "@/src/repositories/userRepository";
import { formatError } from "@/src/utils/formatError";

type SettingsStats = {
  customers: number;
  totalOrders: number;
  openOrders: number;
};

const emptyStats: SettingsStats = {
  customers: 0,
  totalOrders: 0,
  openOrders: 0,
};

const MIN_PASSWORD_LENGTH = 6;

// Saves the current preferences straight from the store (read fresh, so a
// value set right before this call is included).
async function persistPreferences(ownerId: string) {
  const state = useAppStore.getState();
  await userPreferencesRepository.savePreferences({
    ownerId,
    themeMode: "light",
    language: state.language,
    preferredNavigationApp: state.preferredNavigationApp,
    shopName: state.shopName,
    shareIncludeAddress: state.shareIncludeAddress,
    shareIncludePhone: state.shareIncludePhone,
    shareIncludeTotals: state.shareIncludeTotals,
    whatsappTemplateDe: state.whatsappTemplateDe,
    whatsappTemplateAr: state.whatsappTemplateAr,
    whatsappComponents: state.whatsappComponents,
  });
}

export function useSettings() {
  const { t } = useTranslation("settings");
  const user = useCurrentUser();
  const updateDisplayName = useAuthStore((state) => state.updateDisplayName);
  const updateEmail = useAuthStore((state) => state.updateEmail);
  const {
    language,
    preferredNavigationApp,
    shopName,
    shareIncludeAddress,
    shareIncludePhone,
    shareIncludeTotals,
    setLanguage: setStoreLanguage,
    setPreferredNavigationApp: setStorePreferredNavigationApp,
    setShopName,
    setShareOptions,
  } = useAppStore();
  const [fullName, setFullName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFullName(user?.displayName ?? "");
      setEmail(user?.email ?? "");
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [user]);

  useEffect(() => {
    if (!user) {
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 0);

      return () => clearTimeout(timeoutId);
    }

    const timeoutId = setTimeout(() => {
      setLoading(true);
      void Promise.all([
        customerRepository.countCustomersByOwner(user.uid),
        orderRepository.countOrdersByOwner(user.uid),
        orderRepository.countOpenOrdersByOwner(user.uid),
      ])
        .then(([customers, totalOrders, openOrders]) => {
          setStats({ customers, totalOrders, openOrders });
          setError(null);
        })
        .catch((value) => setError(formatError(value).message))
        .finally(() => setLoading(false));
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [user]);

  // Language and navigation app take effect (and are saved) the moment
  // they are picked -- no extra "Save" press needed.
  const setLanguage = useCallback(
    (value: AppLanguage) => {
      setStoreLanguage(value);
      void (async () => {
        if (user) {
          await persistPreferences(user.uid).catch(() => undefined);
        }
        // Caches the choice on this device (that cache is what the next app
        // start uses) and reloads for a real RTL <-> LTR switch -- run last,
        // since a reload cuts off anything after it.
        await applyLanguage(value);
      })();
    },
    [setStoreLanguage, user],
  );

  const setPreferredNavigationApp = useCallback(
    (value: NavigationAppId) => {
      setStorePreferredNavigationApp(value);
      if (user) {
        void persistPreferences(user.uid).catch((persistError) => setError(formatError(persistError).message));
      }
    },
    [setStorePreferredNavigationApp, user],
  );

  // Changes the password on its own, independent of the profile save, so a
  // failing email/profile update can never block it.
  const changePassword = useCallback(async () => {
    const normalizedPassword = newPassword.trim();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (normalizedPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(t("password.tooShort", { count: MIN_PASSWORD_LENGTH }));
      return;
    }

    try {
      setChangingPassword(true);
      await authService.updatePassword(normalizedPassword);
      setNewPassword("");
      setPasswordSuccess(t("password.success"));
    } catch (value) {
      setPasswordError(formatError(value).message);
    } finally {
      setChangingPassword(false);
    }
  }, [newPassword, t]);

  const save = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      const normalizedEmail = email.trim().toLowerCase();
      const hasEmailChanged = normalizedEmail !== (user.email ?? "").trim().toLowerCase();

      if (hasEmailChanged) {
        await authService.updateEmail(normalizedEmail);
      }

      await userRepository.updateOwnProfile({ fullName, email: normalizedEmail });
      await persistPreferences(user.uid);
      updateDisplayName(fullName.trim());
      if (hasEmailChanged) {
        updateEmail(normalizedEmail);
      }
      setSuccessMessage(t("saveSuccess"));
    } catch (value) {
      setError(formatError(value).message);
      setSuccessMessage(null);
    } finally {
      setSaving(false);
    }
  }, [fullName, email, t, updateDisplayName, updateEmail, user]);

  return {
    user,
    fullName,
    setFullName,
    email,
    setEmail,
    newPassword,
    setNewPassword,
    changePassword,
    changingPassword,
    passwordError,
    passwordSuccess,
    loading,
    saving,
    error,
    successMessage,
    stats,
    language,
    preferredNavigationApp,
    shopName,
    shareIncludeAddress,
    shareIncludePhone,
    shareIncludeTotals,
    setLanguage,
    setPreferredNavigationApp,
    setShopName,
    setShareOptions,
    save,
  };
}
