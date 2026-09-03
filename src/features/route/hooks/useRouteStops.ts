import { useEffect, useMemo, useRef, useState } from "react";

import { googleDirectionsApiKey } from "@/src/config/googleDirectionsEnv";
import { routeT } from "@/src/features/route/i18n/routeT";
import {
  RouteDirectionsError,
  buildCumulativeStops,
  buildFallbackLegs,
  computeOsrmTripLegs,
  computeRouteLegs,
  nearestNeighborOrder,
} from "@/src/features/route/services/routeDirectionsService";
import { RouteComputationStatus, RouteOrigin, RoutePoint, RouteStop } from "@/src/features/route/types/routeTypes";
import { useMapCustomers } from "@/src/features/map/hooks/useMapCustomers";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";

const RECOMPUTE_DEBOUNCE_MS = 400;

// MISSING_API_KEY is handled separately below (silent fallback, no banner) —
// it never reaches this map.
const DIRECTIONS_ERROR_MESSAGE_BY_CODE: Record<string, string> = {
  REQUEST_DENIED: "errors.requestDenied",
  OVER_QUERY_LIMIT: "errors.overQueryLimit",
};

function directionsErrorMessage(error: unknown) {
  if (error instanceof RouteDirectionsError) {
    const key = DIRECTIONS_ERROR_MESSAGE_BY_CODE[error.code];
    if (key) {
      return routeT(key);
    }
  }

  return routeT("errors.generic");
}

function toRouteStops(
  entries: { id: string; orderIndex: number; distanceFromPreviousKm: number; cumulativeDistanceKm: number; cumulativeEta: Date }[],
  markerById: Map<string, MapCustomerMarker>,
  isEstimated: boolean,
): RouteStop[] {
  return entries
    .map((entry) => {
      const marker = markerById.get(entry.id);
      if (!marker) {
        return null;
      }

      return {
        marker,
        orderIndex: entry.orderIndex,
        distanceFromPreviousKm: entry.distanceFromPreviousKm,
        cumulativeDistanceKm: entry.cumulativeDistanceKm,
        cumulativeEta: entry.cumulativeEta,
        isEstimated,
      };
    })
    .filter((value): value is RouteStop => value !== null);
}

export function useRouteStops(selectedIds: string[], origin: RouteOrigin | null, departureDate: Date, lastStopId: string | null) {
  const { markers, isLoading: customersLoading, error: customersError, reload } = useMapCustomers();
  const selectedMarkers = useMemo(() => {
    const idSet = new Set(selectedIds);
    return markers.filter((marker) => idSet.has(marker.id));
  }, [markers, selectedIds]);
  const markerById = useMemo(() => new Map(selectedMarkers.map((marker) => [marker.id, marker])), [selectedMarkers]);

  const [stops, setStops] = useState<RouteStop[]>([]);
  const [status, setStatus] = useState<RouteComputationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!origin || !selectedMarkers.length) {
      setStops([]);
      setStatus("idle");
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    const points: RoutePoint[] = selectedMarkers.map((marker) => ({
      id: marker.id,
      latitude: marker.latitude,
      longitude: marker.longitude,
    }));

    const preOrderedPoints = nearestNeighborOrder(origin, points, lastStopId ?? undefined);
    const fallbackStops = buildCumulativeStops(buildFallbackLegs(origin, preOrderedPoints), departureDate);
    setStops(toRouteStops(fallbackStops, markerById, true));
    setStatus("loading");
    setError(null);

    const timeoutId = setTimeout(() => {
      void (async () => {
        function applyLegs(legs: Awaited<ReturnType<typeof computeRouteLegs>>) {
          if (requestIdRef.current !== requestId) return;
          const confirmedStops = buildCumulativeStops(legs, departureDate);
          setStops(toRouteStops(confirmedStops, markerById, false));
          setStatus("ready");
        }

        // Real road order/timing, cheapest+most-accurate first: paid Google
        // (if a key is configured, with true optimize:true), then the free
        // no-signup OSRM "trip" solver (also real road distances, just not
        // Google's traffic-aware estimate). A specific, actionable Google
        // failure (bad/quota'd key) is remembered and only shown if OSRM
        // fails too — otherwise the free result speaks for itself.
        let googleErrorMessage: string | null = null;

        try {
          applyLegs(await computeRouteLegs(origin, points, departureDate, googleDirectionsApiKey, lastStopId ?? undefined));
          return;
        } catch (computeError) {
          if (requestIdRef.current !== requestId) return;
          if (!(computeError instanceof RouteDirectionsError) || computeError.code !== "MISSING_API_KEY") {
            googleErrorMessage = directionsErrorMessage(computeError);
          }
        }

        try {
          applyLegs(await computeOsrmTripLegs(origin, points, lastStopId ?? undefined));
          return;
        } catch {
          // fall through — keep the straight-line preview already shown
        }

        if (requestIdRef.current !== requestId) return;

        if (googleErrorMessage) {
          setError(googleErrorMessage);
          setStatus("error");
        } else {
          setStatus("ready");
        }
      })();
    }, RECOMPUTE_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [origin, departureDate, selectedMarkers, markerById, lastStopId]);

  return {
    stops,
    status,
    error,
    customersLoading,
    customersError,
    reload,
  };
}
