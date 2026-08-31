import * as Location from "expo-location";

import { formatError } from "@/src/utils/formatError";

export type TrackedCoordinate = { latitude: number; longitude: number };

export type LocationTrackingUpdate = {
  coordinate: TrackedCoordinate;
  // Compass heading in degrees while moving, null when stationary/unknown.
  heading: number | null;
};

// Same values as the already-proven watch in features/route/hooks/useLiveLocation.ts —
// balanced accuracy, updates on ~15m movement or every 3s, whichever comes first.
const DISTANCE_INTERVAL_METERS = 15;
const TIME_INTERVAL_MS = 3000;

export const locationTrackingService = {
  async requestForegroundPermission(): Promise<boolean> {
    const permission = await Location.requestForegroundPermissionsAsync();
    return permission.granted;
  },

  async getLastKnownOrCurrentPosition(): Promise<TrackedCoordinate | null> {
    try {
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        return { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude };
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { latitude: current.coords.latitude, longitude: current.coords.longitude };
    } catch {
      return null;
    }
  },

  // Returns an unsubscribe function — the caller must call it when tracking
  // should stop (navigation ended, component unmounted). Resolves to a no-op
  // unsubscribe if the watch itself couldn't start (permission/hardware).
  async watchPosition(
    onUpdate: (update: LocationTrackingUpdate) => void,
    onError: (message: string) => void,
  ): Promise<() => void> {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: DISTANCE_INTERVAL_METERS,
          timeInterval: TIME_INTERVAL_MS,
        },
        (update) => {
          onUpdate({
            coordinate: { latitude: update.coords.latitude, longitude: update.coords.longitude },
            heading: update.coords.heading !== null && update.coords.heading >= 0 ? update.coords.heading : null,
          });
        },
      );

      return () => subscription.remove();
    } catch (error) {
      onError(formatError(error).message);
      return () => undefined;
    }
  },
};
