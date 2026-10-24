// The trip in progress, kept on the device so it survives the OS killing the
// app in the background (common on Android while Google Maps navigates):
// on the next start the driver lands back in the same trip instead of on the
// start screen with every completed/skipped stop forgotten.
// address/city/country: the fields it was entered with, to show them again
// for editing (absent on trips stored before those fields existed).
export type TripStartLocation = {
  latitude: number;
  longitude: number;
  label: string;
  address?: string;
  city?: string;
  country?: string;
};

export type StoredActiveTrip = {
  userId: string;
  // Remaining route in driving order (mid-drive re-sorts/additions included).
  orderedIds: string[];
  handledIds: string[];
  skippedIds: string[];
  // Set when the trip was started for a drawn selection only; absent =
  // every customer on the map is part of the trip.
  scopeIds?: string[] | null;
  // "Start trip" was tapped: only then is the route line drawn on the map.
  started?: boolean;
  // Chosen start point instead of the GPS position; absent = GPS.
  startLocation?: TripStartLocation | null;
  // Chosen departure time ("HH:MM", German time) for the planned arrival
  // times before the trip starts; absent = now.
  departureTime?: string | null;
  savedAt: string;
};

// A trip left open overnight is yesterday's tour, not one to resume.
export const ACTIVE_TRIP_MAX_AGE_MS = 18 * 60 * 60 * 1000;

export function isResumableTrip(trip: StoredActiveTrip | null, userId: string | null, now: number): trip is StoredActiveTrip {
  if (!trip || !userId || trip.userId !== userId || !trip.orderedIds?.length) return false;
  const savedAt = new Date(trip.savedAt).getTime();
  return Number.isFinite(savedAt) && now - savedAt <= ACTIVE_TRIP_MAX_AGE_MS;
}
