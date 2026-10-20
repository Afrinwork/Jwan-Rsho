import { googleDirectionsApiKey } from "@/src/config/googleDirectionsEnv";
import { routeT } from "@/src/features/route/i18n/routeT";
import { geocodeEuropeanAddressOnDevice } from "@/src/features/route/services/routeDeviceGeocodingService";
import { GeocodedLocation, geocodeEuropeanAddress, RouteGeocodingError } from "@/src/features/route/services/routeGeocodingService";
import { geocodeEuropeanAddressViaNominatim } from "@/src/features/route/services/routeNominatimGeocodingService";

// The typed start address of a trip: Google (if a key is configured) -> free
// Nominatim -> the device's own geocoder, same order as customer addresses.
// "Outside Europe" is a real answer and stops the chain right away.
export async function geocodeTripStartAddress(query: string): Promise<GeocodedLocation> {
  const attempts = [
    googleDirectionsApiKey ? geocodeEuropeanAddress : null,
    geocodeEuropeanAddressViaNominatim,
    geocodeEuropeanAddressOnDevice,
  ].filter((attempt) => attempt !== null);

  let lastError: unknown = null;
  for (const attempt of attempts) {
    try {
      return await attempt(query);
    } catch (error) {
      if (error instanceof RouteGeocodingError && error.code === "OUTSIDE_EUROPE") throw error;
      lastError = error;
    }
  }
  throw lastError ?? new RouteGeocodingError("No results.", "NOT_FOUND");
}

export function tripStartGeocodingErrorMessage(error: unknown) {
  if (error instanceof RouteGeocodingError && error.code === "OUTSIDE_EUROPE") return routeT("errors.outsideEurope");
  return routeT("errors.locationNotFound");
}
