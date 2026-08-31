import { googleDirectionsApiKey } from "@/src/config/googleDirectionsEnv";
import { EUROPEAN_COUNTRY_CODES } from "@/src/features/route/constants/europeanCountryCodes";

const GEOCODE_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json";

// Bounding box roughly covering continental Europe (SW|NE corners) — used
// only to bias/prefer results toward Europe. The actual restriction happens
// via the country check below, since Google's "bounds" param is a soft hint.
const EUROPE_BOUNDS = "34.0,-25.0|72.0,45.0";

export type RouteGeocodingErrorCode = "MISSING_API_KEY" | "NOT_FOUND" | "OUTSIDE_EUROPE" | "REQUEST_FAILED";

export class RouteGeocodingError extends Error {
  code: RouteGeocodingErrorCode;

  constructor(message: string, code: RouteGeocodingErrorCode) {
    super(message);
    this.code = code;
  }
}

export type GeocodedLocation = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
};

type GeocodeApiResponse = {
  status: string;
  error_message?: string;
  results: {
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
    address_components: { short_name: string; types: string[] }[];
  }[];
};

export function extractEuropeanLocation(body: GeocodeApiResponse): GeocodedLocation {
  if (body.status === "ZERO_RESULTS") {
    throw new RouteGeocodingError("No results.", "NOT_FOUND");
  }

  if (body.status !== "OK") {
    throw new RouteGeocodingError(body.error_message ?? body.status, "REQUEST_FAILED");
  }

  const [result] = body.results;
  const countryCode = result.address_components.find((component) => component.types.includes("country"))?.short_name;

  if (!countryCode || !EUROPEAN_COUNTRY_CODES.has(countryCode)) {
    throw new RouteGeocodingError("Result is outside Europe.", "OUTSIDE_EUROPE");
  }

  return {
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
  };
}

export async function geocodeEuropeanAddress(query: string): Promise<GeocodedLocation> {
  if (!googleDirectionsApiKey) {
    throw new RouteGeocodingError("Missing Google Geocoding API key.", "MISSING_API_KEY");
  }

  const params = new URLSearchParams({
    address: query,
    bounds: EUROPE_BOUNDS,
    // Forces Latin-script German result text — without this Google can
    // localize formatted_address into the app's Arabic UI language, which
    // looks broken for German/Danish/Swedish etc. place names.
    language: "de",
    key: googleDirectionsApiKey,
  });

  const response = await fetch(`${GEOCODE_ENDPOINT}?${params.toString()}`);

  if (!response.ok) {
    throw new RouteGeocodingError(`Geocoding request failed (${response.status}).`, "REQUEST_FAILED");
  }

  const body = (await response.json()) as GeocodeApiResponse;
  // Show back exactly what the user typed rather than Google's formatted
  // address, so the origin label always stays in the script they searched with.
  return { ...extractEuropeanLocation(body), formattedAddress: query };
}
