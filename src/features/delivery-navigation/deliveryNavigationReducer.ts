import { DeliveryNavigationState, DeliveryStop, initialDeliveryNavigationState } from "@/src/features/delivery-navigation/deliveryNavigationTypes";
import { RoutingCoordinate, RoutingLeg } from "@/src/services/routing/routingTypes";

export type DeliveryNavigationAction =
  | { type: "START"; stops: DeliveryStop[]; currentLocation: RoutingCoordinate | null }
  | { type: "END" }
  | { type: "GPS_UPDATE"; coordinate: RoutingCoordinate }
  | { type: "ROUTE_LOADING" }
  | { type: "ROUTE_LOADED"; leg: RoutingLeg }
  // Kept separate from STOP_COMPLETED/STOP_SKIPPED (which already blank the
  // route themselves) — a mid-leg reroute failure (e.g. a transient network
  // blip while driving) should not blank an already-shown distance/ETA; it
  // just surfaces `error` and leaves the last known numbers on screen.
  | { type: "ROUTE_FAILED"; message: string }
  | { type: "STOP_COMPLETED"; stopIndex: number }
  | { type: "STOP_SKIPPED"; stopIndex: number }
  | { type: "SKIP_TO"; stopIndex: number }
  | { type: "REORDER_LAST"; customerId: string };

function findNextPendingIndex(stops: DeliveryStop[], fromIndex: number): number {
  for (let index = fromIndex + 1; index < stops.length; index += 1) {
    if (stops[index].status === "pending") {
      return index;
    }
  }
  return -1;
}

// Advances past the stop at `stopIndex` (now completed/skipped) to the next
// pending one, activating it — or ends navigation if none remain. This is
// the one place "current GPS location -> next stop" replaces "original
// start -> every stop": the caller must reroute from currentLocation once
// this returns a new active index, never from the just-finished stop's
// address.
function advanceToNextStop(state: DeliveryNavigationState, stopIndex: number): DeliveryNavigationState {
  const nextIndex = findNextPendingIndex(state.stops, stopIndex);

  const stops = state.stops.map((stop, index) => {
    if (index !== nextIndex) return stop;
    return { ...stop, status: "active" as const };
  });

  return {
    ...state,
    stops,
    currentStopIndex: nextIndex,
    isNavigating: nextIndex !== -1,
    // Blanked immediately (not left stale) — the destination just changed,
    // showing the old leg's numbers for the new target would be wrong.
    activeRoute: null,
    remainingRouteDistanceMeters: null,
    remainingRouteDurationSeconds: null,
    estimatedArrival: null,
    error: null,
  };
}

export function deliveryNavigationReducer(
  state: DeliveryNavigationState,
  action: DeliveryNavigationAction,
): DeliveryNavigationState {
  switch (action.type) {
    case "START": {
      const firstPendingIndex = action.stops.findIndex((stop) => stop.status === "pending");
      const stops = action.stops.map((stop, index) =>
        index === firstPendingIndex ? { ...stop, status: "active" as const } : stop,
      );

      return {
        ...initialDeliveryNavigationState,
        isNavigating: firstPendingIndex !== -1,
        stops,
        currentStopIndex: firstPendingIndex,
        currentLocation: action.currentLocation,
      };
    }

    case "END":
      return { ...state, isNavigating: false, activeRoute: null, isRouteLoading: false };

    case "GPS_UPDATE":
      return { ...state, currentLocation: action.coordinate };

    case "ROUTE_LOADING":
      return { ...state, isRouteLoading: true, error: null };

    case "ROUTE_LOADED":
      return {
        ...state,
        isRouteLoading: false,
        error: null,
        activeRoute: action.leg,
        remainingRouteDistanceMeters: action.leg.distanceMeters,
        remainingRouteDurationSeconds: action.leg.durationSeconds,
        estimatedArrival: new Date(Date.now() + action.leg.durationSeconds * 1000),
      };

    case "ROUTE_FAILED":
      return { ...state, isRouteLoading: false, error: action.message };

    case "STOP_COMPLETED": {
      const stops = state.stops.map((stop, index) =>
        index === action.stopIndex ? { ...stop, status: "completed" as const } : stop,
      );
      return advanceToNextStop({ ...state, stops }, action.stopIndex);
    }

    case "STOP_SKIPPED": {
      const stops = state.stops.map((stop, index) =>
        index === action.stopIndex ? { ...stop, status: "skipped" as const } : stop,
      );
      return advanceToNextStop({ ...state, stops }, action.stopIndex);
    }

    case "SKIP_TO": {
      if (action.stopIndex < 0 || action.stopIndex >= state.stops.length) {
        return state;
      }

      const stops = state.stops.map((stop, index) => {
        if (index < action.stopIndex && (stop.status === "active" || stop.status === "pending")) {
          return { ...stop, status: "skipped" as const };
        }
        if (index === action.stopIndex && (stop.status === "active" || stop.status === "pending")) {
          return { ...stop, status: "active" as const };
        }
        if (index !== action.stopIndex && stop.status === "active") {
          return { ...stop, status: "skipped" as const };
        }
        return stop;
      });

      return {
        ...state,
        stops,
        currentStopIndex: action.stopIndex,
        isNavigating: true,
        activeRoute: null,
        remainingRouteDistanceMeters: null,
        remainingRouteDurationSeconds: null,
        estimatedArrival: null,
        error: null,
      };
    }

    // Lets the driver change the route's "last stop" mid-drive, mirroring
    // useRouteLiveNavigation's reorderMarkersLast for this reducer's own
    // stop list — moves the target to the end (keeping the other stops'
    // relative order) instead of re-running the pre-drive nearest-neighbor/
    // Directions optimization. A no-op for a stop that's already
    // completed/skipped (nothing sensible to reprioritize).
    case "REORDER_LAST": {
      const targetIndex = state.stops.findIndex((stop) => stop.customerId === action.customerId);
      if (targetIndex === -1) {
        return state;
      }

      const target = state.stops[targetIndex];
      if (target.status !== "pending" && target.status !== "active") {
        return state;
      }

      const wasActive = target.status === "active";
      const rest = state.stops.filter((stop) => stop.customerId !== action.customerId);
      const stops = [...rest, { ...target, status: "pending" as const }];

      if (!wasActive) {
        const activeIndex = stops.findIndex((stop) => stop.status === "active");
        return { ...state, stops, currentStopIndex: activeIndex };
      }

      // The reprioritized stop WAS the active target — the next pending
      // stop (now first in line) becomes active instead, same as
      // advanceToNextStop, and the route/eta for the old target is blanked
      // since the destination just changed.
      const nextIndex = stops.findIndex((stop) => stop.status === "pending");
      const nextStops = stops.map((stop, index) => (index === nextIndex ? { ...stop, status: "active" as const } : stop));

      return {
        ...state,
        stops: nextStops,
        currentStopIndex: nextIndex,
        isNavigating: nextIndex !== -1,
        activeRoute: null,
        remainingRouteDistanceMeters: null,
        remainingRouteDurationSeconds: null,
        estimatedArrival: null,
        error: null,
      };
    }

    default:
      return state;
  }
}
