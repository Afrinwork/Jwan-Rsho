import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuthStore } from "@/src/store/authStore";

const WINDOW_MS = 24 * 60 * 60 * 1000;

// Same purpose/shape as the Firebase version -- only the uid source
// changed (useAuthStore instead of reaching into the Firebase Auth SDK
// directly), consistent with every other Supabase repository here.
function storageKeys() {
  const uid = useAuthStore.getState().currentUser?.uid ?? "anonymous";
  return { count: `daily_completed_orders_count:${uid}`, windowStart: `daily_completed_orders_window_start:${uid}` };
}

export const dailyCompletionTracker = {
  async recordCompletion() {
    const keys = storageKeys();
    const count = await currentWindowCount(keys);

    if (count === 0) {
      await AsyncStorage.setItem(keys.windowStart, String(Date.now()));
    }

    await AsyncStorage.setItem(keys.count, String(count + 1));
  },

  async getCount() {
    return currentWindowCount(storageKeys());
  },
};

async function currentWindowCount(keys: { count: string; windowStart: string }): Promise<number> {
  const [countRaw, windowStartRaw] = await Promise.all([
    AsyncStorage.getItem(keys.count),
    AsyncStorage.getItem(keys.windowStart),
  ]);

  if (!windowStartRaw || Date.now() - Number(windowStartRaw) >= WINDOW_MS) {
    return 0;
  }

  return countRaw ? Number(countRaw) : 0;
}
