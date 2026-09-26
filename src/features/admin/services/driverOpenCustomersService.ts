import { Order } from "@/src/types/order";

export type DriverOpenCustomers = {
  customerIds: string[];
  // Customers whose every open order for this driver is hidden from them
  // (see Order.hiddenFromDriver) — off the driver's map/route right now.
  hiddenCustomerIds: Set<string>;
};

export function buildDriverOpenCustomers(orders: Order[], driverId: string): DriverOpenCustomers {
  const assigned = orders.filter((order) => order.assignedDriverId === driverId);
  const customerIds = [...new Set(assigned.map((order) => order.customerId))];
  const visible = new Set(assigned.filter((order) => order.hiddenFromDriver !== true).map((order) => order.customerId));
  return { customerIds, hiddenCustomerIds: new Set(customerIds.filter((id) => !visible.has(id))) };
}
