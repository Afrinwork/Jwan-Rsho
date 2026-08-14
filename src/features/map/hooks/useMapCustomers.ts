import { useCallback, useEffect, useState } from "react";

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

export function useMapCustomers(): MapCustomersState {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [markers, setMarkers] = useState<MapCustomerMarker[]>([]);

  const loadCustomers = useCallback(async () => {
    setError(null);

    try {
      const openOrders = await orderRepository.getOpenOrders();
      const customerIds = [...new Set(openOrders.map((value) => value.customerId))];
      const customers = await customerRepository.getCustomersByIds(customerIds);

      setMarkers(buildMapCustomerMarkers(customers, openOrders));
    } catch (loadError) {
      setError(formatError(loadError).message);
    } finally {
      setIsLoading(false);
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
