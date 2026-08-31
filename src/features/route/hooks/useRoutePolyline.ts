import { useEffect, useState } from "react";

import { googleDirectionsApiKey } from "@/src/config/googleDirectionsEnv";
import { fetchRoutePolyline, RouteLatLng } from "@/src/features/route/services/routeDirectionsService";
import { RoutePoint } from "@/src/features/route/types/routeTypes";
import { distanceKm } from "@/src/features/map/utils/circleMath";

type RoutePolylineState = {
  coordinates: RouteLatLng[];
  // Eta/duration/distance to the very next stop, fixed at the moment they
  // were fetched (not ticked down live) — simple and cheap, no extra API
  // calls beyond what we already make for the polyline itself. This is the
  // *planned* distance from the chosen/leg origin, shown to the user so it
  // stays consistent with the list screen — separate from the live-GPS
  // distance used internally for arrival detection, which can differ if the
  // device's GPS fix is inaccurate (e.g. simulator/no real movement yet).
  currentLegEta: Date | null;
  currentLegDurationMinutes: number | null;
  currentLegDistanceKm: number | null;
};

const EMPTY_STATE: RoutePolylineState = {
  coordinates: [],
  currentLegEta: null,
  currentLegDurationMinutes: null,
  currentLegDistanceKm: null,
};

// Fetches the road-following polyline for the remaining stops from the given
// origin. Re-fetches whenever the origin or the remaining-stop set changes —
// e.g. each time a stop is marked done, the caller passes the just-finished
// stop's coordinates as the new origin, so the line always reflects "from
// here to the next address" instead of the stale original full route.
export function useRoutePolyline(origin: RouteLatLng | null, orderedPoints: RoutePoint[]) {
  const [state, setState] = useState<RoutePolylineState>(EMPTY_STATE);
  const pointsKey = orderedPoints.map((point) => point.id).join(",");

  useEffect(() => {
    if (!origin || !orderedPoints.length) {
      setState(origin ? { ...EMPTY_STATE, coordinates: [origin] } : EMPTY_STATE);
      return;
    }

    let cancelled = false;
    // Straight-line fallback for when there's no road-following distance yet
    // (no API key, or the Directions request failed) — still measured from
    // the chosen/leg origin, never from live GPS, so it can't jump to some
    // unrelated number if the device's location happens to be far from the
    // actual route (simulator, no fix yet, stale cache, ...).
    const straightLineDistanceKm = distanceKm(origin, orderedPoints[0]);

    if (!googleDirectionsApiKey) {
      setState({ ...EMPTY_STATE, coordinates: [origin, ...orderedPoints], currentLegDistanceKm: straightLineDistanceKm });
      return;
    }

    void fetchRoutePolyline(origin, orderedPoints, googleDirectionsApiKey)
      .then((result) => {
        if (cancelled) return;

        const firstLeg = result.legs[0] ?? null;
        setState({
          coordinates: result.coordinates.length ? result.coordinates : [origin, ...orderedPoints],
          currentLegEta: firstLeg ? new Date(Date.now() + firstLeg.durationSec * 1000) : null,
          currentLegDurationMinutes: firstLeg ? Math.round(firstLeg.durationSec / 60) : null,
          currentLegDistanceKm: firstLeg ? firstLeg.distanceKm : straightLineDistanceKm,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ ...EMPTY_STATE, coordinates: [origin, ...orderedPoints], currentLegDistanceKm: straightLineDistanceKm });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.latitude, origin?.longitude, pointsKey]);

  return state;
}
