import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";

// Moves the chosen marker to the very end of the array, keeping every other
// marker's relative order untouched. Used to let a driver change which
// customer is the route's "last stop" mid-drive (RouteLastStopDropdown,
// reused on RouteLiveScreen) — unlike the pre-drive planning screen, this
// doesn't re-run nearest-neighbor/Directions optimization, it just
// reprioritizes the remaining stops, which is enough since
// useRouteLiveNavigation derives pendingMarkers/currentMarker straight from
// array order (already-handled stops are filtered out by id regardless of
// their position, so moving one doesn't affect anything about it).
export function reorderMarkersLast(markers: MapCustomerMarker[], lastStopId: string | null): MapCustomerMarker[] {
  if (!lastStopId) {
    return markers;
  }

  const target = markers.find((marker) => marker.id === lastStopId);
  if (!target) {
    return markers;
  }

  return [...markers.filter((marker) => marker.id !== lastStopId), target];
}
