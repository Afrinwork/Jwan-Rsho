import { useEffect, useState } from "react";

import { googleDirectionsApiKey } from "@/src/config/googleDirectionsEnv";
import {
  fetchOsrmRoutePolyline,
  fetchRoutePolyline,
  FALLBACK_AVERAGE_SPEED_KMH,
  RouteLatLng,
} from "@/src/features/route/services/routeDirectionsService";
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
//
// etaAnchor is the instant arrival times are computed from — pass the
// departure time chosen on the list screen so this stays consistent with the
// cumulative arrival times already shown there, instead of silently
// recomputing from whatever "now" happens to be when this screen opens.
// Defaults to the real current time for callers that don't have a chosen
// departure time to anchor to.
export function useRoutePolyline(origin: RouteLatLng | null, orderedPoints: RoutePoint[], etaAnchor: Date = new Date()) {
  const [state, setState] = useState<RoutePolylineState>(EMPTY_STATE);
  const pointsKey = orderedPoints.map((point) => point.id).join(",");
  const etaAnchorMs = etaAnchor.getTime();

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
    // actual route (simulator, no fix yet, stale cache, ...). Duration/ETA
    // are estimated from the same assumed speed as the list screen's preview
    // (FALLBACK_AVERAGE_SPEED_KMH) — without this, the fallback used to fill
    // in only the distance and leave arrival/duration blank ("--:--"/"--").
    const straightLineDistanceKm = distanceKm(origin, orderedPoints[0]);
    const straightLineDurationSec = (straightLineDistanceKm / FALLBACK_AVERAGE_SPEED_KMH) * 3600;
    const straightLineFallback = {
      currentLegDistanceKm: straightLineDistanceKm,
      currentLegDurationMinutes: Math.round(straightLineDurationSec / 60),
      currentLegEta: new Date(etaAnchorMs + straightLineDurationSec * 1000),
    };

    function applyResult(result: { coordinates: RouteLatLng[]; legs: { point: RoutePoint; distanceKm: number; durationSec: number }[] }) {
      if (cancelled) return;

      const firstLeg = result.legs[0] ?? null;
      setState({
        coordinates: result.coordinates.length ? result.coordinates : [origin!, ...orderedPoints],
        currentLegEta: firstLeg ? new Date(etaAnchorMs + firstLeg.durationSec * 1000) : straightLineFallback.currentLegEta,
        currentLegDurationMinutes: firstLeg
          ? Math.round(firstLeg.durationSec / 60)
          : straightLineFallback.currentLegDurationMinutes,
        currentLegDistanceKm: firstLeg ? firstLeg.distanceKm : straightLineDistanceKm,
      });
    }

    // Real road-following line, cheapest/most-reliable source first: paid
    // Google Directions (if a key is configured), then the free no-signup
    // OSRM public server, then — only if both are unreachable — the plain
    // straight-line/assumed-speed estimate, which always works offline.
    void (async () => {
      try {
        if (!googleDirectionsApiKey) throw new Error("no Google key");
        applyResult(await fetchRoutePolyline(origin, orderedPoints, googleDirectionsApiKey));
        return;
      } catch {
        // fall through to OSRM
      }

      try {
        applyResult(await fetchOsrmRoutePolyline(origin, orderedPoints));
        return;
      } catch {
        // fall through to the straight-line estimate
      }

      if (!cancelled) {
        setState({ ...EMPTY_STATE, coordinates: [origin, ...orderedPoints], ...straightLineFallback });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.latitude, origin?.longitude, pointsKey, etaAnchorMs]);

  return state;
}
