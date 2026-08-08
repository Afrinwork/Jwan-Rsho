import { OrderWithItems } from "@/src/types/order";

export type CustomerOrderSections = {
  openOrders: OrderWithItems[];
  historyOrders: OrderWithItems[];
};
