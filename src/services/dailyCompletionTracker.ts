import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth } from "@/src/firebase/auth";

const WINDOW_MS = 24 * 60 * 60 * 1000;

// Keyed per signed-in account — plain fixed keys used to leak this counter
// between accounts on the same device (e.g. someone testing with two
// accounts): account B would see account A's "completed today" count.
// "anonymous" is only a defensive fallback for the unexpected case of no
// signed-in user; every real call site only runs while logged in.
function storageKeys() {
  const uid = auth?.currentUser?.uid ?? "anonymous";
  return { count: `daily_completed_orders_count:${uid}`, windowStart: `daily_completed_orders_window_start:${uid}` };
}

// Since completed orders are deleted outright (see orderRepository.completeOrder),
// there's no persisted record to count "completed today" from. This tracks it
// locally instead: a rolling 24h window that resets to 0 once it expires.
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
