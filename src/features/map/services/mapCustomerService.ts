import { Customer } from "@/src/types/customer";
import { Order } from "@/src/types/order";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { hasStreetAddress } from "@/src/features/customers/services/addressNote";

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
  const hiddenFromDriverIds = customersHiddenFromDriver(orders);

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
      ...(hiddenFromDriverIds.has(value.id) ? { hiddenFromDriver: true } : {}),
    }));

  return spreadOutDuplicateCoordinates(markers);
}

// A customer counts as hidden from their driver when they have assigned
// open orders and every one of those is hidden.
function customersHiddenFromDriver(orders: Order[]) {
  const visible = new Set<string>();
  const hidden = new Set<string>();
  for (const order of orders) {
    if (order.status !== "open" || !order.assignedDriverId) continue;
    (order.hiddenFromDriver ? hidden : visible).add(order.customerId);
  }
  return new Set([...hidden].filter((id) => !visible.has(id)));
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

function sameMarker(left: MapCustomerMarker, right: MapCustomerMarker) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]) as Set<keyof MapCustomerMarker>;
  for (const key of keys) {
    if (left[key] !== right[key]) return false;
  }
  return true;
}

// A live reload fires on every order change of the whole company, and
// usually nothing on this map changed. Keeping unchanged markers (and the
// list itself when nothing changed at all) as the same objects lets the
// route, the pins and every memoized component skip their work.
export function reuseUnchangedMarkers(previous: MapCustomerMarker[], next: MapCustomerMarker[]) {
  const previousById = new Map(previous.map((marker) => [marker.id, marker]));
  let changed = previous.length !== next.length;
  const merged = next.map((marker, index) => {
    const known = previousById.get(marker.id);
    if (known && sameMarker(known, marker)) {
      if (previous[index] !== known) changed = true;
      return known;
    }
    changed = true;
    return marker;
  });
  return changed ? merged : previous;
}
