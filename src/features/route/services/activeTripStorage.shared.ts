// The trip in progress, kept on the device so it survives the OS killing the
// app in the background (common on Android while Google Maps navigates):
// on the next start the driver lands back in the same trip instead of on the
// start screen with every completed/skipped stop forgotten.
export type StoredActiveTrip = {
  userId: string;
  // Remaining route in driving order (mid-drive re-sorts/additions included).
  orderedIds: string[];
  handledIds: string[];
  skippedIds: string[];
  originLat?: number;
  originLng?: number;
  departureTime?: string;
  savedAt: string;
};

// A trip left open overnight is yesterday's tour, not one to resume.
export const ACTIVE_TRIP_MAX_AGE_MS = 18 * 60 * 60 * 1000;

export function isResumableTrip(trip: StoredActiveTrip | null, userId: string | null, now: number): trip is StoredActiveTrip {
  if (!trip || !userId || trip.userId !== userId || !trip.orderedIds?.length) return false;
  const savedAt = new Date(trip.savedAt).getTime();
  return Number.isFinite(savedAt) && now - savedAt <= ACTIVE_TRIP_MAX_AGE_MS;
}
