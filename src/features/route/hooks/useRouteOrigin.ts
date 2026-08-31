import { useCallback, useEffect, useState } from "react";

import { googleDirectionsApiKey } from "@/src/config/googleDirectionsEnv";
import { routeT } from "@/src/features/route/i18n/routeT";
import { geocodeEuropeanAddressOnDevice } from "@/src/features/route/services/routeDeviceGeocodingService";
import { geocodeEuropeanAddress, RouteGeocodingError, RouteGeocodingErrorCode } from "@/src/features/route/services/routeGeocodingService";
import { RouteOrigin } from "@/src/features/route/types/routeTypes";
import { useUserLocation } from "@/src/features/map/hooks/useUserLocation";

const GEOCODING_ERROR_MESSAGE_BY_CODE: Record<RouteGeocodingErrorCode, string> = {
  MISSING_API_KEY: "errors.missingApiKey",
  NOT_FOUND: "errors.locationNotFound",
  OUTSIDE_EUROPE: "errors.outsideEurope",
  REQUEST_FAILED: "errors.generic",
};

function geocodingErrorMessage(error: unknown) {
  if (error instanceof RouteGeocodingError) {
    return routeT(GEOCODING_ERROR_MESSAGE_BY_CODE[error.code]);
  }

  return routeT("errors.generic");
}

export function useRouteOrigin() {
  const { region, hasPermission, isLoading: locationLoading, reload } = useUserLocation();
  const [origin, setOrigin] = useState<RouteOrigin | null>(null);
  const [labelDraft, setLabelDraft] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  // The query text that actually produced the current `origin` via search —
  // lets us tell "typed but never searched" apart from "already resolved",
  // so starting a trip doesn't silently fall back to the current GPS
  // location just because the search button was never tapped.
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(null);

  useEffect(() => {
    if (origin || locationLoading) {
      return;
    }

    const label = hasPermission ? routeT("startCard.currentLocationLabel") : routeT("startCard.fallbackLocationLabel");
    setOrigin({ latitude: region.latitude, longitude: region.longitude, label });
  }, [region, hasPermission, locationLoading, origin]);

  const useCurrentLocation = useCallback(async () => {
    setGeocodeError(null);
    setLabelDraft("");
    setResolvedQuery(null);
    setOrigin(null);
    await reload();
  }, [reload]);

  const searchLocation = useCallback(async (query: string): Promise<RouteOrigin | null> => {
    if (!query.trim()) {
      return null;
    }

    setGeocodeError(null);
    setGeocoding(true);

    try {
      const result = googleDirectionsApiKey
        ? await geocodeEuropeanAddress(query.trim())
        : await geocodeEuropeanAddressOnDevice(query.trim());
      const resolvedOrigin: RouteOrigin = { latitude: result.latitude, longitude: result.longitude, label: result.formattedAddress };
      setOrigin(resolvedOrigin);
      setLabelDraft(query.trim());
      setResolvedQuery(query.trim());
      return resolvedOrigin;
    } catch (error) {
      setGeocodeError(geocodingErrorMessage(error));
      return null;
    } finally {
      setGeocoding(false);
    }
  }, []);

  // Called right before starting a trip: if the user typed an address but
  // never pressed "Suchen", resolve it now instead of silently starting from
  // wherever `origin` currently is (typically the GPS default).
  const ensureOriginMatchesLabel = useCallback(async (): Promise<RouteOrigin | null> => {
    const trimmedLabel = labelDraft.trim();

    if (!trimmedLabel || trimmedLabel === resolvedQuery) {
      return origin;
    }

    return searchLocation(trimmedLabel);
  }, [labelDraft, origin, resolvedQuery, searchLocation]);

  return {
    origin,
    locationLoading,
    labelDraft,
    setLabelDraft,
    geocoding,
    geocodeError,
    searchLocation,
    useCurrentLocation,
    ensureOriginMatchesLabel,
  };
}
