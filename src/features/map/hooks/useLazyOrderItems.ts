import { useState } from "react";

import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { OrderItem } from "@/src/types/orderItem";

// Loads a customer's open-order items on demand (first callout tap) rather
// than prefetching for every marker — markers can number in the hundreds
// and most never get tapped.
export function useLazyOrderItems(customerId: string) {
  const [items, setItems] = useState<OrderItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  function load() {
    if (hasFetched) return;
    setHasFetched(true);
    setLoading(true);
    // Scoped directly to this one customer (ownerId + customerId query) —
    // NOT getOpenOrdersWithItemsByCustomerIds, which fetches every open
    // order the owner has and filters client-side. That's fine for a single
    // batched call, but here it ran fresh on every single pin tap and got
    // slower the more open orders/taps piled up.
    orderDetailsRepository
      .getOrdersByCustomerWithItems(customerId)
      .then((orders) => setItems(orders.filter((order) => order.status === "open").flatMap((order) => order.items)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  return { items, loading, error, load };
}
