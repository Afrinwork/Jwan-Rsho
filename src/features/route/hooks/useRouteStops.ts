import { useEffect, useMemo, useRef, useState } from "react";

import { googleDirectionsApiKey } from "@/src/config/googleDirectionsEnv";
import { routeT } from "@/src/features/route/i18n/routeT";
import {
  RouteDirectionsError,
  buildCumulativeStops,
  buildFallbackLegs,
  computeOsrmTripLegs,
  computeRouteLegs,
  fetchOsrmRoutePolyline,
  fetchRoutePolyline,
  nearestNeighborOrder,
} from "@/src/features/route/services/routeDirectionsService";
import { applyManualOrder } from "@/src/features/route/services/routeManualOrderService";
import { fetchRoadDistanceMatrix, RouteDistanceMatrix } from "@/src/features/route/services/routeDistanceMatrixService";
import { presetRouteOrder, RouteSortMode } from "@/src/features/route/services/routeSortModeService";
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

// `manualOrderIds` (set once the driver moved a stop by hand) switches off
// every automatic optimization: the stops are timed in exactly that order
// (the picked last stop is still moved to the end afterwards).
// Stops the saved/manual order knows keep exactly that order; any others
// (never sorted by hand yet) follow nearest-neighbor from the last of them
// instead of landing at the end in arbitrary order.
function manualPreOrder(origin: RouteOrigin, points: RoutePoint[], manualOrderIds: string[]) {
  const known = new Set(manualOrderIds);
  const ordered = applyManualOrder(points, manualOrderIds);
  const fixed = ordered.filter((point) => known.has(point.id));
  const rest = ordered.filter((point) => !known.has(point.id));
  const lastFixed = fixed.at(-1);
  return [...fixed, ...nearestNeighborOrder(lastFixed ? { ...lastFixed, label: "" } : origin, rest)];
}

// Moves the pinned last stop to the end of a fixed order.
function pinLast(points: RoutePoint[] | null, lastStopId: string | undefined) {
  const pinned = lastStopId ? points?.find((point) => point.id === lastStopId) : undefined;
  return points && pinned ? [...points.filter((point) => point.id !== lastStopId), pinned] : points;
}

export function useRouteStops(
  selectedIds: string[],
  origin: RouteOrigin | null,
  departureDate: Date,
  sortMode: RouteSortMode,
  manualOrderIds: string[] | null = null,
  // Pinned as the very last stop in every sort mode (null = no pin).
  lastStopId: string | null = null,
  // Which "another route" variant to show (sortMode "alternative" only).
  variantIndex = 0,
) {
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

  // Genuine fetch-on-dependency-change effect (React's own documented
  // data-fetching pattern) — the state resets below are the correct,
  // synchronous first step for each branch, not state that could be
  // computed during render instead (the debounced, multi-provider route
  // computation itself must stay in an effect).
  /* eslint-disable react-hooks/set-state-in-effect */
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

    // A fixed order (hand-made, or one of the preset sort modes) is timed
    // exactly as given; only "optimized" lets the providers re-sort.
    const sortable = selectedMarkers.map((marker) => ({ id: marker.id, latitude: marker.latitude, longitude: marker.longitude, city: marker.city }));
    const pinnedLastId = lastStopId && markerById.has(lastStopId) ? lastStopId : undefined;
    const buildFixedOrder = (matrix: RouteDistanceMatrix | null) =>
      pinLast(
        manualOrderIds
          ? manualPreOrder(origin, points, manualOrderIds)
          : presetRouteOrder(sortMode, origin, sortable, variantIndex, matrix)?.map(({ id, latitude, longitude }) => ({ id, latitude, longitude })) ?? null,
        pinnedLastId,
      );
    // Preset modes sort by straight-line distance first so the list shows up
    // instantly, then again by real driving distance once that has loaded.
    const usesRoadMatrix = !manualOrderIds && sortMode !== "optimized";
    let fixedOrder = buildFixedOrder(null);
    let preOrderedPoints = fixedOrder ?? nearestNeighborOrder(origin, points, pinnedLastId);
    const showPreview = () =>
      setStops(toRouteStops(buildCumulativeStops(buildFallbackLegs(origin, preOrderedPoints), departureDate), markerById, true));
    showPreview();
    setStatus("loading");
    setError(null);

    const timeoutId = setTimeout(() => {
      void (async () => {
        if (usesRoadMatrix) {
          const roadMatrix = await fetchRoadDistanceMatrix(origin, sortable);
          if (requestIdRef.current !== requestId) return;
          if (roadMatrix) {
            fixedOrder = buildFixedOrder(roadMatrix);
            preOrderedPoints = fixedOrder ?? preOrderedPoints;
            showPreview();
          }
        }

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
        //
        // A fixed order uses the same provider chain, but the
        // non-optimizing requests — legs come back in exactly
        // preOrderedPoints' order instead of being re-sorted.
        const computeGoogleLegs = fixedOrder
          ? async () => (await fetchRoutePolyline(origin, preOrderedPoints, googleDirectionsApiKey)).legs
          : () => computeRouteLegs(origin, points, departureDate, googleDirectionsApiKey, pinnedLastId);
        const computeOsrmLegs = fixedOrder
          ? async () => (await fetchOsrmRoutePolyline(origin, preOrderedPoints)).legs
          : () => computeOsrmTripLegs(origin, points, pinnedLastId);
        let googleErrorMessage: string | null = null;

        try {
          applyLegs(await computeGoogleLegs());
          return;
        } catch (computeError) {
          if (requestIdRef.current !== requestId) return;
          if (!(computeError instanceof RouteDirectionsError) || computeError.code !== "MISSING_API_KEY") {
            googleErrorMessage = directionsErrorMessage(computeError);
          }
        }

        try {
          applyLegs(await computeOsrmLegs());
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
  }, [origin, departureDate, selectedMarkers, markerById, sortMode, manualOrderIds, lastStopId, variantIndex]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return {
    stops,
    status,
    error,
    customersLoading,
    customersError,
    reload,
  };
}
