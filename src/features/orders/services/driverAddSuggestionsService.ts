import { distanceKm } from "@/src/features/map/utils/circleMath";
import { Customer } from "@/src/types/customer";
import { Order } from "@/src/types/order";

export type DriverAddSuggestion = {
  customer: Customer;
  distanceKm: number | null;
  openOrders: Order[];
  reason: "nearby" | "route";
};

type Coordinate = { latitude: number; longitude: number };

export function buildDriverAddSuggestions(
  customers: Customer[],
  openOrders: Order[],
  currentLocation: Coordinate | null,
  limit = 5,
): DriverAddSuggestion[] {
  const ordersByCustomerId = new Map<string, Order[]>();
  for (const order of openOrders) {
    ordersByCustomerId.set(order.customerId, [...(ordersByCustomerId.get(order.customerId) ?? []), order]);
  }

  return customers
    .map((customer): DriverAddSuggestion => {
      const hasCoordinates = Number.isFinite(customer.latitude) && Number.isFinite(customer.longitude);
      const customerDistance = currentLocation && hasCoordinates
        ? distanceKm(currentLocation, { latitude: customer.latitude!, longitude: customer.longitude! })
        : null;
      const customerOrders = ordersByCustomerId.get(customer.id) ?? [];

      return {
        customer,
        distanceKm: customerDistance,
        openOrders: customerOrders,
        reason: customerOrders.length > 0 ? "route" : "nearby",
      };
    })
    .sort((left, right) => {
      if (left.reason !== right.reason) return left.reason === "route" ? -1 : 1;
      if (left.distanceKm === null && right.distanceKm !== null) return 1;
      if (left.distanceKm !== null && right.distanceKm === null) return -1;
      if (left.distanceKm !== null && right.distanceKm !== null && left.distanceKm !== right.distanceKm) {
        return left.distanceKm - right.distanceKm;
      }
      return left.customer.fullName.localeCompare(right.customer.fullName, "de");
    })
    .slice(0, limit);
}
