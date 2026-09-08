import { useCallback, useEffect, useRef, useState } from "react";

import { customerRepository } from "@/src/repositories/customerRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { buildMapCustomerMarkers, hasValidCoordinates } from "@/src/features/map/services/mapCustomerService";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { geocodingService } from "@/src/services/geocodingService";
import { Customer } from "@/src/types/customer";
import { formatError } from "@/src/utils/formatError";

// Self-heal for customers whose address failed to geocode earlier (a
// transient network blip, a temporary rate limit, ...) and so have no
// coordinates — geocoding only ever ran once, at creation/edit time, so a
// one-off failure otherwise left them permanently invisible on the map even
// though they have an open order. Retried on every map load; best effort,
// silent on failure so it never blocks the normal marker list above.
async function healMissingCoordinates(customers: Customer[]): Promise<Customer[]> {
  const missing = customers.filter((customer) => !hasValidCoordinates(customer));

  if (!missing.length) {
    return customers;
  }

  const resolved = await Promise.all(
    missing.map(async (customer) => {
      try {
        const coordinates = await geocodingService.geocodeCustomerAddressSafely({
          address: customer.address,
          city: customer.city,
          country: customer.country,
          region: customer.region,
        });

        if (!coordinates) {
          return null;
        }

        await customerRepository.updateCustomer(customer.id, coordinates);
        return { id: customer.id, coordinates };
      } catch {
        return null;
      }
    }),
  );

  const coordinatesById = new Map(
    resolved
      .filter((entry): entry is { id: string; coordinates: { latitude: number; longitude: number } } => entry !== null)
      .map((entry) => [entry.id, entry.coordinates]),
  );

  if (!coordinatesById.size) {
    return customers;
  }

  return customers.map((customer) => {
    const coordinates = coordinatesById.get(customer.id);
    return coordinates ? { ...customer, ...coordinates } : customer;
  });
}

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

      const healedCustomers = await healMissingCoordinates(customers);

      if (requestIdRef.current !== requestId) return;

      const nextMarkers = buildMapCustomerMarkers(healedCustomers, openOrders);
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
