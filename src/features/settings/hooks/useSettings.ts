import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { authService } from "@/src/features/auth/services/authService";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
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

export function useSettings() {
  const { t } = useTranslation("settings");
  const user = useCurrentUser();
  const updateDisplayName = useAuthStore((state) => state.updateDisplayName);
  const updateEmail = useAuthStore((state) => state.updateEmail);
  const {
    themeMode,
    preferredNavigationApp,
    shopName,
    shareIncludeAddress,
    shareIncludePhone,
    shareIncludeTotals,
    setThemeMode,
    setPreferredNavigationApp,
    setShopName,
    setShareOptions,
  } = useAppStore();
  const [fullName, setFullName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [newPassword, setNewPassword] = useState("");
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
      const normalizedPassword = newPassword.trim();

      if (hasEmailChanged) {
        await authService.updateEmail(normalizedEmail);
      }

      if (normalizedPassword) {
        await authService.updatePassword(normalizedPassword);
      }

      await userRepository.updateOwnProfile({ fullName, email: normalizedEmail });
      await userPreferencesRepository.savePreferences({
        ownerId: user.uid,
        themeMode,
        preferredNavigationApp,
        shopName,
        shareIncludeAddress,
        shareIncludePhone,
        shareIncludeTotals,
      });
      updateDisplayName(fullName.trim());
      if (hasEmailChanged) {
        updateEmail(normalizedEmail);
      }
      setNewPassword("");
      setSuccessMessage(t("saveSuccess"));
    } catch (value) {
      setError(formatError(value).message);
      setSuccessMessage(null);
    } finally {
      setSaving(false);
    }
  }, [
    fullName,
    email,
    preferredNavigationApp,
    shopName,
    shareIncludeAddress,
    shareIncludePhone,
    shareIncludeTotals,
    themeMode,
    t,
    updateDisplayName,
    updateEmail,
    newPassword,
    user,
  ]);

  return {
    user,
    fullName,
    setFullName,
    email,
    setEmail,
    newPassword,
    setNewPassword,
    loading,
    saving,
    error,
    successMessage,
    stats,
    themeMode,
    preferredNavigationApp,
    shopName,
    shareIncludeAddress,
    shareIncludePhone,
    shareIncludeTotals,
    setThemeMode,
    setPreferredNavigationApp,
    setShopName,
    setShareOptions,
    save,
  };
}
