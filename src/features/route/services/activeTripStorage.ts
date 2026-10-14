import AsyncStorage from "@react-native-async-storage/async-storage";

import { isResumableTrip, StoredActiveTrip } from "@/src/features/route/services/activeTripStorage.shared";

export type { StoredActiveTrip };

const STORAGE_KEY = "rsho.activeTrip";

// Storage failures are swallowed on purpose: resuming is a convenience and
// must never disturb the drive itself.
export const activeTripStorage = {
  async load(userId: string | null): Promise<StoredActiveTrip | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const trip = raw ? (JSON.parse(raw) as StoredActiveTrip) : null;
      return isResumableTrip(trip, userId, Date.now()) ? trip : null;
    } catch {
      return null;
    }
  },

  async save(trip: Omit<StoredActiveTrip, "savedAt">) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...trip, savedAt: new Date().toISOString() }));
    } catch {
      // ignored on purpose
    }
  },

  async clear() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignored on purpose
    }
  },
};
