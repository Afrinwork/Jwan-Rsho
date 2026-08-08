import { OrderWithItems } from "@/src/types/order";
import { buildProductTotals } from "@/src/utils/orderItemTotals";

export function buildCityProductTotals(orders: OrderWithItems[]) {
  return buildProductTotals(orders);
}
