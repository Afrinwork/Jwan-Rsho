import { useCallback, useEffect, useState } from "react";

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
  const user = useCurrentUser();
  const updateDisplayName = useAuthStore((state) => state.updateDisplayName);
  const {
    themeMode,
    preferredNavigationApp,
    shareIncludeAddress,
    shareIncludePhone,
    shareIncludeTotals,
    setThemeMode,
    setPreferredNavigationApp,
    setShareOptions,
  } = useAppStore();
  const [fullName, setFullName] = useState(user?.displayName ?? "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFullName(user?.displayName ?? "");
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
      await userRepository.updateOwnProfile({ fullName });
      await userPreferencesRepository.savePreferences({
        ownerId: user.uid,
        themeMode,
        preferredNavigationApp,
        shareIncludeAddress,
        shareIncludePhone,
        shareIncludeTotals,
      });
      updateDisplayName(fullName.trim());
      setSuccessMessage("Einstellungen wurden gespeichert.");
    } catch (value) {
      setError(formatError(value).message);
      setSuccessMessage(null);
    } finally {
      setSaving(false);
    }
  }, [
    fullName,
    preferredNavigationApp,
    shareIncludeAddress,
    shareIncludePhone,
    shareIncludeTotals,
    themeMode,
    updateDisplayName,
    user,
  ]);

  const resetPassword = useCallback(async () => {
    if (!user?.email) {
      setError("Keine E-Mail fuer Passwort-Reset vorhanden.");
      return;
    }

    try {
      setResettingPassword(true);
      setError(null);
      setSuccessMessage(null);
      await authService.resetPassword(user.email);
      setSuccessMessage("Passwort-Reset wurde per E-Mail versendet.");
    } catch (value) {
      setError(formatError(value).message);
    } finally {
      setResettingPassword(false);
    }
  }, [user]);

  return {
    user,
    fullName,
    setFullName,
    loading,
    saving,
    resettingPassword,
    error,
    successMessage,
    stats,
    themeMode,
    preferredNavigationApp,
    shareIncludeAddress,
    shareIncludePhone,
    shareIncludeTotals,
    setThemeMode,
    setPreferredNavigationApp,
    setShareOptions,
    save,
    resetPassword,
  };
}
