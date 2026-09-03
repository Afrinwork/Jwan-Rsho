// Free, no-signup geocoding via OpenStreetMap's Nominatim — used when there's
// no Google Geocoding API key, before falling back further to the device's
// own (usually less complete for European addresses) geocoder. Nominatim's
// usage policy requires an identifying User-Agent and caps requests at 1/sec
// — fine for a single manual search here, but this must never be looped or
// called per-marker/bulk.
import { EUROPEAN_COUNTRY_CODES } from "@/src/features/route/constants/europeanCountryCodes";
import { GeocodedLocation, RouteGeocodingError } from "@/src/features/route/services/routeGeocodingService";

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_USER_AGENT = "RshoOrdersApp/1.0 (delivery route planning)";

type NominatimResult = {
  lat: string;
  lon: string;
  address?: { country_code?: string };
};

export async function geocodeEuropeanAddressViaNominatim(query: string): Promise<GeocodedLocation> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "1",
  });

  const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
    headers: { "User-Agent": NOMINATIM_USER_AGENT },
  });

  if (!response.ok) {
    throw new RouteGeocodingError(`Nominatim request failed (${response.status}).`, "REQUEST_FAILED");
  }

  const results = (await response.json()) as NominatimResult[];
  const [result] = results;

  if (!result) {
    throw new RouteGeocodingError("No results.", "NOT_FOUND");
  }

  const countryCode = result.address?.country_code?.toUpperCase();
  if (!countryCode || !EUROPEAN_COUNTRY_CODES.has(countryCode)) {
    throw new RouteGeocodingError("Result is outside Europe.", "OUTSIDE_EUROPE");
  }

  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    // Echo back exactly what the user typed, same convention as the
    // Google/device geocoders — keeps the origin label in the script the
    // user searched with instead of Nominatim's own display_name.
    formattedAddress: query,
  };
}
