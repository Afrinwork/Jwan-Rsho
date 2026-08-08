import { OrderWithItems } from "@/src/types/order";

import { CustomerOrderSections } from "@/src/features/customers/types/customerDetailsTypes";

export function splitCustomerOrders(orders: OrderWithItems[]): CustomerOrderSections {
  return {
    openOrders: orders.filter((value) => value.status === "open"),
    historyOrders: orders.filter((value) => value.status !== "open"),
  };
}
