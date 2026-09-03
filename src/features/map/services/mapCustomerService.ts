import { Customer } from "@/src/types/customer";
import { Order } from "@/src/types/order";

export function buildMapCustomerMarkers(customers: Customer[], orders: Order[]) {
  const openOrderCountByCustomerId = new Map<string, number>();
  orders
    .filter((value) => value.status === "open")
    .forEach((value) => {
      openOrderCountByCustomerId.set(value.customerId, (openOrderCountByCustomerId.get(value.customerId) ?? 0) + 1);
    });

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
      hasStreetAddress: Boolean(value.address.trim()),
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

function hasValidCoordinates(
  customer: Customer,
): customer is Customer & { latitude: number; longitude: number } {
  return Number.isFinite(customer.latitude) && Number.isFinite(customer.longitude);
}

function formatCustomerAddress(customer: Customer) {
  return [customer.address, customer.city].filter((part) => part.trim()).join(", ");
}
