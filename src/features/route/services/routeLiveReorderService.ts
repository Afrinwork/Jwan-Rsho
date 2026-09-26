import { distanceKm } from "@/src/features/map/utils/circleMath";
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

// Slots newly assigned stops into a route that is already being driven —
// each one goes wherever it adds the least straight-line detour (cheapest
// insertion), but only AFTER `anchorId` (the currently active stop), so the
// stop the driver is heading to right now never changes underneath them and
// completed/skipped stops (all before the anchor) are never reshuffled. With
// no anchor (every stop already handled) the new stops are simply appended.
export function insertMarkersAfterAnchor(
  markers: MapCustomerMarker[],
  newMarkers: MapCustomerMarker[],
  anchorId: string | null,
): MapCustomerMarker[] {
  const existingIds = new Set(markers.map((marker) => marker.id));
  const toInsert = newMarkers.filter((marker) => !existingIds.has(marker.id));
  if (!toInsert.length) {
    return markers;
  }

  const result = [...markers];
  const anchorIndex = anchorId ? result.findIndex((marker) => marker.id === anchorId) : -1;
  const minInsertIndex = anchorIndex === -1 ? result.length : anchorIndex + 1;

  for (const marker of toInsert) {
    let bestIndex = result.length;
    let bestCost = Infinity;

    for (let index = Math.min(minInsertIndex, result.length); index <= result.length; index += 1) {
      const previous = result[index - 1];
      const next = result[index];
      const cost =
        (previous ? distanceKm(previous, marker) : 0) +
        (next ? distanceKm(marker, next) : 0) -
        (previous && next ? distanceKm(previous, next) : 0);

      if (cost < bestCost) {
        bestCost = cost;
        bestIndex = index;
      }
    }

    result.splice(bestIndex, 0, marker);
  }

  return result;
}
