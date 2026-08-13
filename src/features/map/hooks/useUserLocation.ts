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

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setHasPermission(true);
      setRegion(toRegion(currentLocation));
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
