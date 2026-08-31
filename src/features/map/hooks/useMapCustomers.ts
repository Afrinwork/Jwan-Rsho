import { useCallback, useEffect, useRef, useState } from "react";

import { customerRepository } from "@/src/repositories/customerRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { buildMapCustomerMarkers } from "@/src/features/map/services/mapCustomerService";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { formatError } from "@/src/utils/formatError";

type MapCustomersState = {
  error: string | null;
  isLoading: boolean;
  markers: MapCustomerMarker[];
  reload: () => Promise<void>;
};

const isDev = typeof __DEV__ === "undefined" || __DEV__;

export function useMapCustomers(): MapCustomersState {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [markers, setMarkers] = useState<MapCustomerMarker[]>([]);
  // reload() can be called again (retry button, screen refocus) before an
  // earlier call has finished — this discards a stale response instead of
  // letting it overwrite state from a load that started later.
  const requestIdRef = useRef(0);

  const loadCustomers = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const startedAt = isDev ? Date.now() : 0;
    if (isDev) console.log(`[Map] load started (request ${requestId})`);
    setError(null);

    try {
      const openOrders = await orderRepository.getOpenOrders();
      const uniqueCustomerIds = [...new Set(openOrders.map((value) => value.customerId))];
      const customers = await customerRepository.getCustomersByIds(uniqueCustomerIds);

      if (requestIdRef.current !== requestId) return;

      const nextMarkers = buildMapCustomerMarkers(customers, openOrders);
      setMarkers(nextMarkers);

      if (isDev) {
        console.log(
          `[Map] load finished: ${openOrders.length} open orders, ${uniqueCustomerIds.length} unique customer ids, ` +
            `${nextMarkers.length} markers, ${Date.now() - startedAt}ms`,
        );
      }
    } catch (loadError) {
      if (requestIdRef.current !== requestId) return;
      setError(formatError(loadError).message);
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadCustomers();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadCustomers]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    await loadCustomers();
  }, [loadCustomers]);

  return {
    error,
    isLoading,
    markers,
    reload,
  };
}
