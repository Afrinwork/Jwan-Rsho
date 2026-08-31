import { useEffect, useState } from "react";
import * as Location from "expo-location";

import { formatError } from "@/src/utils/formatError";

type LiveLocationState = {
  coordinate: { latitude: number; longitude: number } | null;
  // Compass heading in degrees while moving (null when stationary/unknown) —
  // used to rotate the camera on Android, which has no followsUserLocation.
  heading: number | null;
  error: string | null;
};

const DISTANCE_INTERVAL_METERS = 15;
const TIME_INTERVAL_MS = 3000;

export function useLiveLocation() {
  const [state, setState] = useState<LiveLocationState>({ coordinate: null, heading: null, error: null });

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function start() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          if (!cancelled) setState({ coordinate: null, heading: null, error: "Standortzugriff wurde abgelehnt." });
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: DISTANCE_INTERVAL_METERS,
            timeInterval: TIME_INTERVAL_MS,
          },
          (update) => {
            if (cancelled) return;
            setState({
              coordinate: { latitude: update.coords.latitude, longitude: update.coords.longitude },
              heading: update.coords.heading !== null && update.coords.heading >= 0 ? update.coords.heading : null,
              error: null,
            });
          },
        );
      } catch (error) {
        if (!cancelled) setState({ coordinate: null, heading: null, error: formatError(error).message });
      }
    }

    void start();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return state;
}
