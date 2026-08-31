// ISO 3166-1 alpha-2 codes for geographic Europe (incl. UK, Switzerland,
// Balkans, Baltics) — broader than just EU membership, matching "Europe" as
// the driver would understand it. Shared between the Google-based and
// on-device geocoding fallback so both apply the same restriction.
export const EUROPEAN_COUNTRY_CODES = new Set([
  "AD", "AL", "AT", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
  "FO", "FR", "GB", "GG", "GI", "GR", "HR", "HU", "IE", "IM", "IS", "IT", "JE", "LI", "LT",
  "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "SE", "SI",
  "SK", "SM", "UA", "VA", "XK",
]);
