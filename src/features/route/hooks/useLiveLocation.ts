import { useEffect, useState } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";

import { formatError } from "@/src/utils/formatError";

type LiveLocationState = {
  coordinate: { latitude: number; longitude: number } | null;
  // Compass heading in degrees while moving (null when stationary/unknown) —
  // used to rotate the camera on Android, which has no followsUserLocation.
  heading: number | null;
  error: string | null;
};

// Every update re-renders the whole map screen, so not more often than
// needed: arrival detection (120 m) and the route refresh (500 m) are far
// coarser than this.
const DISTANCE_INTERVAL_METERS = 20;
const TIME_INTERVAL_MS = 5000;

export function useLiveLocation() {
  const [state, setState] = useState<LiveLocationState>({ coordinate: null, heading: null, error: null });
  const [appActive, setAppActive] = useState(AppState.currentState === "active");

  // No GPS while the app is in the background (e.g. the driver is in Google
  // Maps): saves battery and avoids a burst of queued updates on return.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => setAppActive(nextState === "active"));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!appActive) return;

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function start() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          if (!cancelled) setState({ coordinate: null, heading: null, error: "Standortzugriff wurde abgelehnt." });
          return;
        }

        const nextSubscription = await Location.watchPositionAsync(
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
        // Stopped while the watch was still starting.
        if (cancelled) nextSubscription.remove();
        else subscription = nextSubscription;
      } catch (error) {
        if (!cancelled) setState({ coordinate: null, heading: null, error: formatError(error).message });
      }
    }

    void start();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [appActive]);

  return state;
}
