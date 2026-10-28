// Stamped into the customer note on save when no street is on file (empty,
// or just the city typed again) — geocoding then only finds the city
// centre, so the driver needs to know the pin is not the customer's door.
// Bilingual on purpose, same as buildDriverOrderNote: stored once and read
// later by users whose app language may differ.
export const NO_STREET_NOTE = "⚠️ Keine genaue Adresse / لا يوجد عنوان دقيق";

export function hasStreetAddress(customer: { address?: string; city?: string }) {
  const address = normalizeAddressPart(customer.address ?? "");
  const city = normalizeAddressPart(customer.city ?? "");
  return Boolean(address) && address !== city;
}

// Street and house number, e.g. "Hauptstraße 5" — the format the hint under
// the address field asks for. Anything else is confirmed before saving.
export function isPreciseAddress(customer: { address?: string; city?: string }) {
  const address = customer.address ?? "";
  return hasStreetAddress(customer) && /\p{L}/u.test(address) && /\d/.test(address);
}

// Adds the stamp as the note's first line when the street is missing, and
// removes it again once a street is entered. The rest of the note is kept.
export function withAddressNote<T extends { address?: string; city?: string; note?: string }>(customer: T): T & { note: string } {
  const rest = (customer.note ?? "")
    .split("\n")
    .filter((line) => line.trim() !== NO_STREET_NOTE)
    .join("\n")
    .trim();
  const note = hasStreetAddress(customer) ? rest : [NO_STREET_NOTE, rest].filter(Boolean).join("\n");
  return { ...customer, note };
}

function normalizeAddressPart(value: string) {
  return value.trim().toLocaleLowerCase("de-DE").replace(/\s+/g, " ");
}
