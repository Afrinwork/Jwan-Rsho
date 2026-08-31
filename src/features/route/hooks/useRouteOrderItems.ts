import { useEffect, useState } from "react";

import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { OrderWithItems } from "@/src/types/order";
import { formatError } from "@/src/utils/formatError";

function groupByCustomerId(orders: OrderWithItems[]) {
  const grouped = new Map<string, OrderWithItems[]>();
  orders.forEach((order) => {
    grouped.set(order.customerId, [...(grouped.get(order.customerId) ?? []), order]);
  });
  return grouped;
}

export function useRouteOrderItems(customerIds: string[]) {
  const [ordersByCustomerId, setOrdersByCustomerId] = useState<Map<string, OrderWithItems[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idsKey = customerIds.join(",");

  useEffect(() => {
    if (!idsKey) {
      setOrdersByCustomerId(new Map());
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void orderDetailsRepository
      .getOpenOrdersWithItemsByCustomerIds(idsKey.split(","))
      .then((orders) => {
        if (cancelled) return;
        setOrdersByCustomerId(groupByCustomerId(orders));
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(formatError(loadError).message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return { ordersByCustomerId, isLoading, error };
}
