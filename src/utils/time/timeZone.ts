// ISO 3166-1 alpha-2 country code -> IANA timezone for the countries this app
// currently manages (see src/types/country.ts `isoCode`). Central mapping so
// no UI file hardcodes a fixed offset — offsets shift with DST, IANA zones
// don't. Add new entries here, not in components.
const COUNTRY_TIME_ZONES: Record<string, string> = {
  DE: "Europe/Berlin",
  AT: "Europe/Vienna",
  CH: "Europe/Zurich",
  FR: "Europe/Paris",
  NL: "Europe/Amsterdam",
  DK: "Europe/Copenhagen",
  BE: "Europe/Brussels",
  LU: "Europe/Luxembourg",
  PL: "Europe/Warsaw",
};

const DEFAULT_TIME_ZONE = "Europe/Berlin";

export function getTimeZoneForCountry(isoCode?: string | null): string {
  if (!isoCode) {
    return DEFAULT_TIME_ZONE;
  }

  return COUNTRY_TIME_ZONES[isoCode.toUpperCase()] ?? DEFAULT_TIME_ZONE;
}
