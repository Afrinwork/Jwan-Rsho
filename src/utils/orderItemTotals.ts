import { OrderWithItems } from "@/src/types/order";
import { ProductTotal } from "@/src/types/productTotal";

export function buildProductTotals(orders: OrderWithItems[]): ProductTotal[] {
  const totals = new Map<string, ProductTotal>();

  orders
    .filter((value) => value.status === "open")
    .forEach((order) => {
      order.items.forEach((item) => {
        const key = `${item.productId}:${item.unit}`;
        const current = totals.get(key);
        totals.set(key, {
          productKey: key,
          productName: current?.productName ?? item.productNameSnapshot.trim(),
          quantity: (current?.quantity ?? 0) + item.quantity,
          unit: item.unit.trim(),
        });
      });
    });

  return [...totals.values()].sort((left, right) => left.productName.localeCompare(right.productName));
}
