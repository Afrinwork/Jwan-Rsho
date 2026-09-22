import { distanceKm } from "@/src/features/map/utils/circleMath";
import { formatTime } from "@/src/utils/date";

// Deliberately conservative in-town estimate (no live traffic/road-network
// data here, unlike the route screen's Directions-API-backed ETA) -- this
// is a quick "roughly when" for a WhatsApp message sent from the map
// screen's customer selection, not tied to an active route.
const AVERAGE_SPEED_KMH = 40;

export type LatLng = { latitude: number; longitude: number };

// Straight-line distance from the sharer's current position -- returns
// undefined (rather than a misleading guess) when no position is known,
// e.g. location permission denied or still loading.
export function estimateArrivalLabel(origin: LatLng | null | undefined, target: LatLng): string | undefined {
  if (!origin) {
    return undefined;
  }

  const distance = distanceKm(origin, target);
  const arrival = new Date(Date.now() + (distance / AVERAGE_SPEED_KMH) * 3600 * 1000);
  return formatTime(arrival.toISOString());
}
