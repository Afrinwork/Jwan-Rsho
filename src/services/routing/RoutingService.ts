import { distanceKm } from "@/src/features/map/utils/circleMath";
import { fetchRoutePolyline, RouteDirectionsError } from "@/src/features/route/services/routeDirectionsService";
import { RoutingCoordinate, RoutingError, RoutingLeg } from "@/src/services/routing/routingTypes";

// Same assumed average speed as the route-planning screen's pre-network
// preview (buildFallbackLegs in routeDirectionsService.ts, kept in sync with
// that constant) — used here when no Directions API key is configured, so
// live navigation still shows a reasonable (if approximate) distance/ETA
// instead of erroring outright. 70 km/h approximates a realistic German
// city/highway driving mix.
const FALLBACK_AVERAGE_SPEED_KMH = 70;

export function estimateStraightLineLeg(origin: RoutingCoordinate, destination: RoutingCoordinate): RoutingLeg {
  const distance = distanceKm(origin, destination);

  return {
    distanceMeters: distance * 1000,
    durationSeconds: (distance / FALLBACK_AVERAGE_SPEED_KMH) * 3600,
    polyline: [origin, destination],
  };
}

// Thin wrapper around the already-battle-tested Directions client used by the
// route-planning/live screens (waypoint chunking, polyline decoding, response
// parsing all live there — see routeDirectionsService.ts) — reused here
// rather than reimplemented, just narrowed to the single-destination shape
// live navigation needs: exactly `currentLocation -> activeStop`, never the
// whole remaining tour in one request.
export async function fetchSingleLegRoute(
  origin: RoutingCoordinate,
  destination: RoutingCoordinate & { id: string },
  apiKey: string,
): Promise<RoutingLeg> {
  try {
    const result = await fetchRoutePolyline(origin, [destination], apiKey);
    const leg = result.legs[0];

    if (!leg) {
      throw new RoutingError("No route returned.", "NO_ROUTE");
    }

    return {
      distanceMeters: leg.distanceKm * 1000,
      durationSeconds: leg.durationSec,
      polyline: result.coordinates,
    };
  } catch (error) {
    if (error instanceof RoutingError) {
      throw error;
    }

    if (error instanceof RouteDirectionsError) {
      throw new RoutingError(error.message, error.code === "MISSING_API_KEY" ? "MISSING_API_KEY" : "REQUEST_FAILED");
    }

    throw new RoutingError(error instanceof Error ? error.message : "Routing request failed.", "REQUEST_FAILED");
  }
}
