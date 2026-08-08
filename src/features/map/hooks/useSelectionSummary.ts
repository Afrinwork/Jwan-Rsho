import { useCallback, useMemo, useState } from "react";

import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { buildProductTotals } from "@/src/utils/orderItemTotals";
import { formatError } from "@/src/utils/formatError";
import { OrderWithItems } from "@/src/types/order";

export function useSelectionSummary(selectedIds: string[]) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => buildProductTotals(orders), [orders]);

  const ensureLoaded = useCallback(async () => {
    if (!selectedIds.length) {
      setOrders([]);
      return [] as OrderWithItems[];
    }

    setIsLoading(true);
    setError(null);

    try {
      const loadedOrders = await orderDetailsRepository.getOpenOrdersWithItemsByCustomerIds(selectedIds);
      setOrders(loadedOrders);
      return loadedOrders;
    } catch (loadError) {
      setError(formatError(loadError).message);
      return [] as OrderWithItems[];
    } finally {
      setIsLoading(false);
    }
  }, [selectedIds]);

  return {
    orders,
    totals,
    isLoading,
    error,
    ensureLoaded,
  };
}
