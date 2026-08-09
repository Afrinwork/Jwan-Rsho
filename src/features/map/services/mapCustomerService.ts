import { Customer } from "@/src/types/customer";
import { Order } from "@/src/types/order";

export function buildMapCustomerMarkers(customers: Customer[], orders: Order[]) {
  const openOrderCountByCustomerId = new Map<string, number>();
  orders
    .filter((value) => value.status === "open")
    .forEach((value) => {
      openOrderCountByCustomerId.set(value.customerId, (openOrderCountByCustomerId.get(value.customerId) ?? 0) + 1);
    });

  return customers
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
    }));
}

function hasValidCoordinates(
  customer: Customer,
): customer is Customer & { latitude: number; longitude: number } {
  return Number.isFinite(customer.latitude) && Number.isFinite(customer.longitude);
}

function formatCustomerAddress(customer: Customer) {
  return `${customer.address}, ${customer.city}`;
}
