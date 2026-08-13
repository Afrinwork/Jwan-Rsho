import AsyncStorage from "@react-native-async-storage/async-storage";

const COUNT_KEY = "daily_completed_orders_count";
const WINDOW_START_KEY = "daily_completed_orders_window_start";
const WINDOW_MS = 24 * 60 * 60 * 1000;

// Since completed orders are deleted outright (see orderRepository.completeOrder),
// there's no persisted record to count "completed today" from. This tracks it
// locally instead: a rolling 24h window that resets to 0 once it expires.
export const dailyCompletionTracker = {
  async recordCompletion() {
    const count = await currentWindowCount();

    if (count === 0) {
      await AsyncStorage.setItem(WINDOW_START_KEY, String(Date.now()));
    }

    await AsyncStorage.setItem(COUNT_KEY, String(count + 1));
  },

  async getCount() {
    return currentWindowCount();
  },
};

async function currentWindowCount(): Promise<number> {
  const [countRaw, windowStartRaw] = await Promise.all([
    AsyncStorage.getItem(COUNT_KEY),
    AsyncStorage.getItem(WINDOW_START_KEY),
  ]);

  if (!windowStartRaw || Date.now() - Number(windowStartRaw) >= WINDOW_MS) {
    return 0;
  }

  return countRaw ? Number(countRaw) : 0;
}
