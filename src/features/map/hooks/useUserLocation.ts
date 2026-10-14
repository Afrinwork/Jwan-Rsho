import { useCallback, useEffect, useState } from "react";
import { mapT } from "@/src/features/map/i18n/mapT";

import * as Location from "expo-location";

import { MapRegion } from "@/src/features/map/types/mapTypes";
import { formatError } from "@/src/utils/formatError";

const FALLBACK_REGION: MapRegion = {
  latitude: 52.52,
  longitude: 13.405,
  latitudeDelta: 5,
  longitudeDelta: 5,
};

const DEFAULT_DELTA = {
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const CURRENT_POSITION_TIMEOUT_MS = 8000;

// Resolves to null when the promise has not settled within timeoutMs.
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => resolve(null), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

function toRegion(location: Location.LocationObject): MapRegion {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    ...DEFAULT_DELTA,
  };
}

type UserLocationState = {
  error: string | null;
  isLoading: boolean;
  hasPermission: boolean;
  region: MapRegion;
  reload: () => Promise<void>;
};

export function useUserLocation(): UserLocationState {
  const t = mapT;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [region, setRegion] = useState<MapRegion>(FALLBACK_REGION);

  const loadLocation = useCallback(async () => {
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setHasPermission(false);
        setRegion(FALLBACK_REGION);
        setError(t("errors.locationPermissionDenied"));
        return;
      }

      // On Android getCurrentPositionAsync can wait forever without a GPS fix
      // (seen on Samsung phones indoors), which kept the map stuck on the
      // loading screen. Show the last known position right away, cap the fresh
      // lookup, and let the watch below refine the position later.
      const lastKnownLocation = await Location.getLastKnownPositionAsync().catch(() => null);

      setHasPermission(true);
      if (lastKnownLocation) {
        setRegion(toRegion(lastKnownLocation));
        setIsLoading(false);
      }

      const currentLocation = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch((currentError) => {
          // A last known position is good enough; only fail without one.
          if (lastKnownLocation) return null;
          throw currentError;
        }),
        CURRENT_POSITION_TIMEOUT_MS,
      );

      if (currentLocation) setRegion(toRegion(currentLocation));
    } catch (loadError) {
      setHasPermission(false);
      setRegion(FALLBACK_REGION);
      setError(formatError(loadError).message);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadLocation();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadLocation]);

  useEffect(() => {
    if (!hasPermission) return;

    let active = true;
    let subscription: Location.LocationSubscription | null = null;

    // The initial location gets the map on screen quickly. This foreground
    // watch then keeps the blue dot current while a driver moves between
    // customers, without requesting background-location permission.
    void Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 15, timeInterval: 15_000 },
      (location) => {
        if (active) setRegion(toRegion(location));
      },
    )
      .then((nextSubscription) => {
        if (active) {
          subscription = nextSubscription;
        } else {
          nextSubscription.remove();
        }
      })
      .catch((watchError) => {
        if (active) setError(formatError(watchError).message);
      });

    return () => {
      active = false;
      subscription?.remove();
    };
  }, [hasPermission]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    await loadLocation();
  }, [loadLocation]);

  return {
    error,
    isLoading,
    hasPermission,
    region,
    reload,
  };
}
