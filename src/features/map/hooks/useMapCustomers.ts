import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { isDriver } from "@/src/features/auth/permissions";
import { customerRepository } from "@/src/repositories/customerRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { buildMapCustomerMarkers, getCustomersNeedingAddressCheck, hasValidCoordinates } from "@/src/features/map/services/mapCustomerService";
import { CustomerNeedingAddressCheck, MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
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

        await customerRepository.updateCustomer(customer.id, { ...coordinates, locationStatus: "ok" });
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
  needsAddressCheck: CustomerNeedingAddressCheck[];
  openOrdersCount: number;
  customersCount: number;
  newAssignmentMessage: string | null;
  reload: () => Promise<void>;
};

const isDev = typeof __DEV__ === "undefined" || __DEV__;

export function useMapCustomers(): MapCustomersState {
  const { t } = useTranslation("map");
  const currentUser = useCurrentUser();
  const isCurrentUserDriver = isDriver(currentUser);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [markers, setMarkers] = useState<MapCustomerMarker[]>([]);
  const [needsAddressCheck, setNeedsAddressCheck] = useState<CustomerNeedingAddressCheck[]>([]);
  const [openOrdersCount, setOpenOrdersCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [newAssignmentMessage, setNewAssignmentMessage] = useState<string | null>(null);
  // reload() can be called again (retry button, screen refocus) before an
  // earlier call has finished — this discards a stale response instead of
  // letting it overwrite state from a load that started later.
  const requestIdRef = useRef(0);
  // Seeded by the live subscription's first fire (see below) so the initial
  // snapshot never counts as "new" — only orders that show up afterwards do.
  const knownOrderIdsRef = useRef<Set<string> | null>(null);

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
      const nextNeedsAddressCheck = getCustomersNeedingAddressCheck(healedCustomers, openOrders);
      setMarkers(nextMarkers);
      setNeedsAddressCheck(nextNeedsAddressCheck);
      setOpenOrdersCount(openOrders.length);
      setCustomersCount(uniqueCustomerIds.length);

      if (isDev) {
        console.log(
          `[Map] load finished: ${openOrders.length} open orders, ${uniqueCustomerIds.length} unique customer ids, ` +
            `${nextMarkers.length} markers, ${nextNeedsAddressCheck.length} needing address check, ${Date.now() - startedAt}ms`,
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

  // Passive live refresh: whenever the set of open orders in scope changes
  // server-side (a new customer/order assigned to this driver, one
  // completed elsewhere, ...), silently reload so the map stays current
  // without a manual pull-to-refresh or leaving and reopening the screen.
  // The initial fire (which onSnapshot always sends immediately with the
  // current matching orders) triggers a redundant first reload alongside
  // the mount-time load above — a harmless, one-time extra read traded for
  // keeping loadCustomers()'s existing one-shot fetch untouched.
  //
  // For a driver specifically, also surfaces a brief on-screen notice when
  // orders they didn't already know about show up — this is what actually
  // tells them "something new was assigned to you" without requiring a real
  // push notification. Only meaningful for a driver: an admin/super_admin
  // would just be notified about their own actions.
  useEffect(() => {
    knownOrderIdsRef.current = null;

    const unsubscribe = orderRepository.subscribeToOpenOrders(
      (orders) => {
        if (isCurrentUserDriver) {
          const previousIds = knownOrderIdsRef.current;
          if (previousIds) {
            const newCount = orders.filter((value) => !previousIds.has(value.id)).length;
            if (newCount > 0) {
              setNewAssignmentMessage(t("screen.newAssignment", { count: newCount }));
            }
          }
          knownOrderIdsRef.current = new Set(orders.map((value) => value.id));
        }

        void loadCustomers();
      },
      () => {
        // Best-effort: a live-refresh failure (e.g. a transient permission
        // hiccup right after sign-in) shouldn't surface its own error state —
        // the next successful snapshot, or the existing retry button wired to
        // reload(), recovers it. loadCustomers() itself still reports errors
        // for the reload()-driven path.
      },
    );

    return unsubscribe;
  }, [isCurrentUserDriver, loadCustomers, t]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    await loadCustomers();
  }, [loadCustomers]);

  return {
    error,
    isLoading,
    markers,
    needsAddressCheck,
    openOrdersCount,
    customersCount,
    newAssignmentMessage,
    reload,
  };
}
