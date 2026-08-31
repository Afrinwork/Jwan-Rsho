// Fallback used when no Google Directions/Geocoding API key is configured
// (EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY) — uses the device's native geocoder
// via expo-location instead, so the start-location search still works without
// any Google Cloud setup. Kept in its own file (not imported by
// routeGeocodingService.test.ts) because expo-location pulls in react-native,
// which the plain node:test runner can't transform.
import { EUROPEAN_COUNTRY_CODES } from "@/src/features/route/constants/europeanCountryCodes";
import { GeocodedLocation, RouteGeocodingError } from "@/src/features/route/services/routeGeocodingService";
import { geocodingService } from "@/src/services/geocodingService";

export async function geocodeEuropeanAddressOnDevice(query: string): Promise<GeocodedLocation> {
  let coarse: { latitude: number; longitude: number } | null;

  try {
    coarse = await geocodingService.geocodeAddress(query);
  } catch {
    throw new RouteGeocodingError("Device geocoding failed.", "REQUEST_FAILED");
  }

  if (!coarse) {
    throw new RouteGeocodingError("No results.", "NOT_FOUND");
  }

  let address: Awaited<ReturnType<typeof geocodingService.reverseGeocode>>;

  try {
    address = await geocodingService.reverseGeocode(coarse);
  } catch {
    throw new RouteGeocodingError("Reverse geocoding failed.", "REQUEST_FAILED");
  }

  const countryCode = address?.isoCountryCode ?? undefined;

  if (!countryCode || !EUROPEAN_COUNTRY_CODES.has(countryCode)) {
    throw new RouteGeocodingError("Result is outside Europe.", "OUTSIDE_EUROPE");
  }

  return {
    latitude: coarse.latitude,
    longitude: coarse.longitude,
    // The device's reverse geocoder can localize street/city/country into
    // the app's Arabic UI language, which looks broken for a German/Danish/
    // Swedish etc. place name — show back exactly what the user typed instead.
    formattedAddress: query,
  };
}
