import { useCallback, useEffect, useMemo, useState } from "react";

import { useUserLocation } from "@/src/features/map/hooks/useUserLocation";
import { buildDriverAddSuggestions, DriverAddSuggestion } from "@/src/features/orders/services/driverAddSuggestionsService";
import { customerRepository } from "@/src/repositories/customerRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { Customer } from "@/src/types/customer";
import { Order } from "@/src/types/order";
import { formatError } from "@/src/utils/formatError";

export function useDriverAddSuggestions() {
  const location = useUserLocation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [customers, openOrders] = await Promise.all([
        customerRepository.getCustomers(),
        orderRepository.getOpenOrders(),
      ]);
      setCustomers(customers);
      setOpenOrders(openOrders);
    } catch (loadError) {
      setError(formatError(loadError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location.isLoading) return;
    const timeoutId = setTimeout(() => void load(), 0);
    return () => clearTimeout(timeoutId);
  }, [load, location.isLoading]);

  const suggestions = useMemo<DriverAddSuggestion[]>(() => {
    const coordinate = location.hasPermission
      ? { latitude: location.region.latitude, longitude: location.region.longitude }
      : null;
    return buildDriverAddSuggestions(customers, openOrders, coordinate);
  }, [customers, location.hasPermission, location.region.latitude, location.region.longitude, openOrders]);

  return { error, loading: loading || location.isLoading, reload: load, suggestions };
}
