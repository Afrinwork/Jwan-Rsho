import * as Location from "expo-location";

import { googleDirectionsApiKey } from "@/src/config/googleDirectionsEnv";
import { geocodeEuropeanAddress } from "@/src/features/route/services/routeGeocodingService";
import { geocodeEuropeanAddressViaNominatim } from "@/src/features/route/services/routeNominatimGeocodingService";

type AddressInput = {
  address: string;
  city: string;
  country: string;
  region?: string;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

// Region/country are frequently stored in Arabic in this app (e.g. region
// "شمال راين", country "ألمانيا") — fine for display, but mixed into a
// geocoding search string it confuses the geocoder into matching the wrong
// place, or nothing at all, for every city, not just some. Geocoding queries
// only ever use fields that are plain Latin script.
const ARABIC_SCRIPT_PATTERN = /[؀-ۿ]/;

function isGeocodableText(value: string | undefined) {
  return Boolean(value?.trim()) && !ARABIC_SCRIPT_PATTERN.test(value!);
}

function isSamePlace(first: string, second: string) {
  return first.trim().toLocaleLowerCase("de-DE") === second.trim().toLocaleLowerCase("de-DE");
}

export const geocodingService = {
  composeAddress(input: AddressInput) {
    return [input.address.trim(), input.city.trim(), input.region?.trim(), input.country.trim()]
      .filter(Boolean)
      .join(", ");
  },

  // Deliberately narrower than composeAddress (display text) — street and
  // city only, plus region/country but ONLY when they're actually in Latin
  // script (see ARABIC_SCRIPT_PATTERN above).
  composeGeocodingQuery(input: AddressInput) {
    const addressIsOnlyCity = isSamePlace(input.address, input.city);

    // A repeated city is an imprecise stop, not a street address. Query the
    // city plus country once so geocoders resolve the intended city centre.
    return [addressIsOnlyCity ? "" : input.address, input.city, input.region, input.country]
      .filter(isGeocodableText)
      .map((value) => value!.trim())
      .join(", ");
  },

  async geocodeAddress(address: string): Promise<Coordinates | null> {
    const [result] = await Location.geocodeAsync(address);
    return result
      ? { latitude: result.latitude, longitude: result.longitude }
      : null;
  },

  async reverseGeocode(coordinates: Coordinates): Promise<Location.LocationGeocodedAddress | null> {
    const [result] = await Location.reverseGeocodeAsync(coordinates);
    return result ?? null;
  },

  // Google (if a key is configured) -> free Nominatim -> the device's own
  // geocoder as the last resort. The device geocoder alone (the old, only
  // path here) is noticeably weaker for city-only queries — some cities it
  // just can't resolve at all, silently leaving the customer without a map
  // marker. Nominatim in particular is much more reliable for that case.
  async geocodeCustomerAddress(input: AddressInput): Promise<Coordinates | null> {
    const query = this.composeGeocodingQuery(input);

    if (googleDirectionsApiKey) {
      try {
        return await geocodeEuropeanAddress(query);
      } catch {
        // fall through
      }
    }

    try {
      return await geocodeEuropeanAddressViaNominatim(query);
    } catch {
      // fall through to the device geocoder below
    }

    return this.geocodeAddress(query);
  },

  async geocodeCustomerAddressSafely(input: AddressInput) {
    try {
      return await this.geocodeCustomerAddress(input);
    } catch {
      return null;
    }
  },
};
