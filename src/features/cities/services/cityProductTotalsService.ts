import { OrderWithItems } from "@/src/types/order";

import { CityProductTotal } from "@/src/features/cities/types/cityProductTotalTypes";

export function buildCityProductTotals(orders: OrderWithItems[]) {
  const totals = new Map<string, CityProductTotal>();

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
