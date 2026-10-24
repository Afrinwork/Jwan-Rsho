import { googleDirectionsApiKey } from "@/src/config/googleDirectionsEnv";
import { routeT } from "@/src/features/route/i18n/routeT";
import { geocodeEuropeanAddressOnDevice } from "@/src/features/route/services/routeDeviceGeocodingService";
import { GeocodedLocation, geocodeEuropeanAddress, RouteGeocodingError } from "@/src/features/route/services/routeGeocodingService";
import { geocodeEuropeanAddressViaNominatim } from "@/src/features/route/services/routeNominatimGeocodingService";
import { geocodingService } from "@/src/services/geocodingService";

export type TripStartAddressInput = { address: string; city: string; country: string };

// The start address of a trip, entered like a customer address: Google (if a
// key is configured) -> free Nominatim -> the device's own geocoder, same
// order as customer addresses. Every geocoder gets its turn — one of them
// answering "outside Europe" (e.g. Google picking a same-named street abroad)
// no longer stops the others from finding the right place. If street + city
// finds nothing, the address field alone is tried too, for a full address
// typed into it ("Weserstraße 24, 10247 Berlin") with a city that doesn't fit.
export async function geocodeTripStartAddress(input: TripStartAddressInput): Promise<GeocodedLocation> {
  const fullQuery = geocodingService.composeGeocodingQuery(input);
  const queries = [...new Set([fullQuery, input.address.trim()].filter(Boolean))];
  const attempts = [
    googleDirectionsApiKey ? geocodeEuropeanAddress : null,
    geocodeEuropeanAddressViaNominatim,
    geocodeEuropeanAddressOnDevice,
  ].filter((attempt) => attempt !== null);

  let outsideEurope = false;
  for (const query of queries) {
    for (const attempt of attempts) {
      try {
        const location = await attempt(query);
        return { ...location, formattedAddress: startLabel(input) };
      } catch (error) {
        if (error instanceof RouteGeocodingError && error.code === "OUTSIDE_EUROPE") outsideEurope = true;
      }
    }
  }
  throw new RouteGeocodingError("No results.", outsideEurope ? "OUTSIDE_EUROPE" : "NOT_FOUND");
}

// What the driver entered, in their own script — not the geocoder's text.
function startLabel(input: TripStartAddressInput) {
  const address = input.address.trim().replace(/\s*\n\s*/g, ", ");
  const city = input.city.trim();
  if (!city || address.toLocaleLowerCase("de-DE").includes(city.toLocaleLowerCase("de-DE"))) return address || city;
  return address ? `${address}, ${city}` : city;
}

export function tripStartGeocodingErrorMessage(error: unknown) {
  if (error instanceof RouteGeocodingError && error.code === "OUTSIDE_EUROPE") return routeT("errors.outsideEurope");
  return routeT("errors.locationNotFound");
}
