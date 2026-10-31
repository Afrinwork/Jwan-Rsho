import * as Location from "expo-location";

import { geocodingService } from "@/src/services/geocodingService";

// On Android getCurrentPositionAsync can wait forever without a GPS fix (seen
// on Samsung phones indoors) and the device geocoder can hang without a
// network — a button waiting on either stayed on its spinner for good.
const CURRENT_POSITION_TIMEOUT_MS = 10_000;
const REVERSE_GEOCODE_TIMEOUT_MS = 5_000;
// A last known position older than this is not "where the driver is now".
const LAST_KNOWN_MAX_AGE_MS = 10 * 60 * 1000;

// Resolves to null when the promise has not settled within timeoutMs.
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => resolve(null), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

// A fresh fix if one comes within the time limit, else a recent last known
// position, else null (the caller shows "location unavailable").
export async function getCurrentPositionOrRecent(): Promise<Location.LocationObject | null> {
  const fresh = await withTimeout(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null),
    CURRENT_POSITION_TIMEOUT_MS,
  );
  if (fresh) return fresh;
  return Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }).catch(() => null);
}

// Readable address for a position; the coordinates when the geocoder has
// nothing or takes too long.
export async function describePosition(coordinate: { latitude: number; longitude: number }) {
  const place = await withTimeout(geocodingService.reverseGeocode(coordinate), REVERSE_GEOCODE_TIMEOUT_MS).catch(() => null);
  return [place?.name, place?.street, place?.postalCode, place?.city, place?.country]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(", ") || `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}`;
}
