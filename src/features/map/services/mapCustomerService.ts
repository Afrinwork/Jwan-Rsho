import { Customer } from "@/src/types/customer";
import { Order } from "@/src/types/order";

export function countOpenOrdersByCustomerId(orders: Order[]) {
  const openOrderCountByCustomerId = new Map<string, number>();
  orders
    .filter((value) => value.status === "open")
    .forEach((value) => {
      openOrderCountByCustomerId.set(value.customerId, (openOrderCountByCustomerId.get(value.customerId) ?? 0) + 1);
    });
  return openOrderCountByCustomerId;
}

export function buildMapCustomerMarkers(customers: Customer[], orders: Order[]) {
  const openOrderCountByCustomerId = countOpenOrdersByCustomerId(orders);

  const markers = customers
    .filter((value) => openOrderCountByCustomerId.has(value.id))
    .filter(hasValidCoordinates)
    .sort((left, right) => left.fullName.localeCompare(right.fullName))
    .map((value, index) => ({
      id: value.id,
      title: value.fullName,
      description: formatCustomerAddress(value),
      phone: value.phone,
      note: value.note ?? "",
      latitude: value.latitude as number,
      longitude: value.longitude as number,
      numberLabel: String(index + 1),
      openOrderCount: openOrderCountByCustomerId.get(value.id) ?? 0,
      country: value.country,
      city: value.city,
      region: value.region ?? "",
      hasStreetAddress: hasStreetAddress(value),
    }));

  return spreadOutDuplicateCoordinates(markers);
}

// City-only addresses (no street) all geocode to the exact same point — the
// city center — so two or more such customers in the same city would render
// as perfectly overlapping, individually untappable pins. There's no real
// map clustering yet (mapClusteringService is a pass-through), so this
// spreads exact-coordinate duplicates into a small circle around the shared
// point for display only; the customer's actual stored coordinates are
// untouched.
const DUPLICATE_COORDINATE_SPREAD_DEGREES = 0.0009; // roughly 100m

function spreadOutDuplicateCoordinates<T extends { latitude: number; longitude: number }>(markers: T[]): T[] {
  const groups = new Map<string, T[]>();

  for (const marker of markers) {
    const key = `${marker.latitude.toFixed(5)},${marker.longitude.toFixed(5)}`;
    const group = groups.get(key);
    if (group) {
      group.push(marker);
    } else {
      groups.set(key, [marker]);
    }
  }

  return [...groups.values()].flatMap((group) => {
    if (group.length === 1) {
      return group;
    }

    return group.map((marker, index) => {
      const angle = (2 * Math.PI * index) / group.length;
      return {
        ...marker,
        latitude: marker.latitude + DUPLICATE_COORDINATE_SPREAD_DEGREES * Math.sin(angle),
        longitude: marker.longitude + DUPLICATE_COORDINATE_SPREAD_DEGREES * Math.cos(angle),
      };
    });
  });
}

export function hasValidCoordinates(
  customer: Customer,
): customer is Customer & { latitude: number; longitude: number } {
  return Number.isFinite(customer.latitude) && Number.isFinite(customer.longitude);
}

// The other half of buildMapCustomerMarkers()'s coordinate filter: every
// customer with an open order that DIDN'T make it onto the map goes here
// instead, so "no marker" never silently means "gone" — see the "Adresse
// pruefen" list on the map screen. Together with buildMapCustomerMarkers,
// every customer with an open order ends up in exactly one of the two lists.
export function getCustomersNeedingAddressCheck(customers: Customer[], orders: Order[]) {
  const openOrderCountByCustomerId = countOpenOrdersByCustomerId(orders);

  return customers
    .filter((value) => openOrderCountByCustomerId.has(value.id))
    .filter((value) => !hasValidCoordinates(value))
    .sort((left, right) => left.fullName.localeCompare(right.fullName))
    .map((value) => ({
      id: value.id,
      fullName: value.fullName,
      address: formatCustomerAddress(value),
      phone: value.phone,
      openOrderCount: openOrderCountByCustomerId.get(value.id) ?? 0,
    }));
}

function formatCustomerAddress(customer: Customer) {
  return [customer.address, customer.city].filter((part) => part.trim()).join(", ");
}

function hasStreetAddress(customer: Customer) {
  const address = normalizeAddressPart(customer.address);
  const city = normalizeAddressPart(customer.city);

  // A frequent data-entry shortcut is entering the city again in the street
  // field. Geocoders then return the city centre, not the customer's address.
  // Treat it exactly like an empty street: keep the customer visible, but use
  // the warning marker so a dispatcher knows the stop needs a real address.
  return Boolean(address) && address !== city;
}

function normalizeAddressPart(value: string) {
  return value.trim().toLocaleLowerCase("de-DE").replace(/\s+/g, " ");
}
