import { useCallback, useEffect, useRef, useState } from "react";

import { customerRepository } from "@/src/repositories/customerRepository";
import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { formatError } from "@/src/utils/formatError";

import { MapCustomerDetails } from "@/src/features/map/types/mapTypes";

type MapCustomerDetailsState = {
  details: MapCustomerDetails | null;
  error: string | null;
  isLoading: boolean;
  reload: () => Promise<void>;
};

export function useMapCustomerDetails(customerId: string | null): MapCustomerDetailsState {
  const [details, setDetails] = useState<MapCustomerDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef(0);

  const loadDetails = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!customerId) {
      setDetails(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [customer, orders] = await Promise.all([
        customerRepository.getCustomerById(customerId),
        orderDetailsRepository.getOrdersByCustomerWithItems(customerId),
      ]);
      if (requestId !== requestIdRef.current) return;
      const openOrders = orders.filter((value) => value.status === "open");
      setDetails({ customer, openOrders });
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      setError(formatError(loadError).message);
      setDetails(null);
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadDetails();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      requestIdRef.current += 1;
    };
  }, [loadDetails]);

  return {
    details,
    error,
    isLoading,
    reload: loadDetails,
  };
}
