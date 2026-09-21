import { useState } from "react";

import { adminService } from "@/src/features/admin/services/adminService";
import { formatError } from "@/src/utils/formatError";

// Shared deactivate/reactivate/delete/edit actions for the driver and admin
// dashboards — both manage the same kind of row (a UserProfile with an
// email and an isActive flag) through the same Cloud Functions.
export function useUserActions(onChanged: () => void | Promise<void>) {
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setActive(email: string, isActive: boolean) {
    setBusyEmail(email);
    setError(null);

    try {
      await adminService.setUserActiveState({ email, isActive });
      await onChanged();
    } catch (actionError) {
      setError(formatError(actionError).message);
    } finally {
      setBusyEmail(null);
    }
  }

  async function remove(email: string) {
    setBusyEmail(email);
    setError(null);

    try {
      await adminService.deleteUser(email);
      await onChanged();
    } catch (actionError) {
      setError(formatError(actionError).message);
    } finally {
      setBusyEmail(null);
    }
  }

  async function update(email: string, changes: { fullName?: string; newEmail?: string }) {
    setBusyEmail(email);
    setError(null);

    try {
      await adminService.updateManagedUser({ email, ...changes });
      await onChanged();
      return true;
    } catch (actionError) {
      setError(formatError(actionError).message);
      return false;
    } finally {
      setBusyEmail(null);
    }
  }

  return { busyEmail, error, remove, setActive, update };
}
