import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { orderRepository } from "@/src/repositories/orderRepository";

const LAST_RUN_KEY = "last_completed_order_cleanup";
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

// Best-effort, client-side housekeeping: deletes the current user's own
// completed orders past their retention window (see COMPLETED_ORDER_RETENTION_DAYS
// in orderRepository.ts). Runs at most once a day, so it stays free — no
// Cloud Functions / Blaze plan required.
export function useOrderCleanup() {
  const user = useCurrentUser();

  useEffect(() => {
    if (!user) {
      return;
    }

    void (async () => {
      const lastRun = await AsyncStorage.getItem(LAST_RUN_KEY);
      const now = Date.now();

      if (lastRun && now - Number(lastRun) < CHECK_INTERVAL_MS) {
        return;
      }

      try {
        await orderRepository.deleteExpiredCompletedOrders();
      } catch {
        // Silent — this is background housekeeping, not something to surface to the user.
      } finally {
        await AsyncStorage.setItem(LAST_RUN_KEY, String(now));
      }
    })();
  }, [user]);
}
