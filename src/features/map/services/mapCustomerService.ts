import { Customer } from "@/src/types/customer";
import { Order } from "@/src/types/order";

export function buildMapCustomerMarkers(customers: Customer[], orders: Order[]) {
  const openOrdersByCustomerId = new Map(
    orders
      .filter((value) => value.status === "open")
      .map((value) => [value.customerId, value]),
  );

  return customers
    .filter((value) => openOrdersByCustomerId.has(value.id))
    .filter(hasValidCoordinates)
    .sort((left, right) => left.fullName.localeCompare(right.fullName))
    .map((value, index) => ({
      id: value.id,
      title: value.fullName,
      description: formatCustomerAddress(value),
      phone: value.phone,
      latitude: value.latitude as number,
      longitude: value.longitude as number,
      numberLabel: String(index + 1),
      currentOpenOrderId: openOrdersByCustomerId.get(value.id)?.id ?? null,
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
  return `${customer.street} ${customer.houseNumber}, ${customer.postalCode} ${customer.city}`;
}
