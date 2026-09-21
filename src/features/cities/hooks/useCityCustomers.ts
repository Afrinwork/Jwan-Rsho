import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cityRepository } from "@/src/repositories/cityRepository";
import { customerRepository } from "@/src/repositories/customerRepository";
import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { normalizeCity } from "@/src/utils/normalizeCity";
import { formatError } from "@/src/utils/formatError";

import { buildCityCustomerItems, filterCityCustomerItems } from "@/src/features/cities/services/cityCustomerService";
import { buildCityProductTotals } from "@/src/features/cities/services/cityProductTotalsService";
import { CityCustomerItem } from "@/src/features/cities/types/cityCustomerTypes";
import { CityProductTotal } from "@/src/features/cities/types/cityProductTotalTypes";
import { City } from "@/src/types/city";

export function useCityCustomers(normalizedCity: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<CityCustomerItem[]>([]);
  const [cityEntity, setCityEntity] = useState<City | null>(null);
  const [productTotals, setProductTotals] = useState<CityProductTotal[]>([]);
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const completingOrderIdRef = useRef<string | null>(null);

  const loadCityData = useCallback(async () => {
    const [customers, city] = await Promise.all([
      customerRepository.getCustomersByNormalizedCity(normalizedCity),
      cityRepository.getCityByNormalizedName(normalizedCity),
    ]);
    const orders = await orderRepository.getOrders();
    setItems(buildCityCustomerItems(customers, orders));

    if (city) {
      setCityEntity(city);
    } else if (customers[0]) {
      // City entity not backfilled yet (e.g. deep-linked before the Cities
      // list ran its one-time backfill) — create it now so it's there for
      // rename/delete, and so it persists even if these customers go away.
      await cityRepository.ensureCityExists(customers[0].city);
      setCityEntity(await cityRepository.getCityByNormalizedName(normalizedCity));
    }

    const openOrders = await orderDetailsRepository.getOpenOrdersWithItemsByCustomerIds(
      customers.map((value) => value.id),
    );
    setProductTotals(buildCityProductTotals(openOrders));
  }, [normalizedCity]);

  useEffect(() => {
    // Genuine fetch-on-dependency-change effect (React's own documented
    // data-fetching pattern) — setLoading(true) is the correct, synchronous
    // first step, not state that could be computed during render instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    loadCityData()
      .catch((value) => setError(formatError(value).message))
      .finally(() => setLoading(false));
  }, [loadCityData]);

  async function completeOrder(orderId: string) {
    if (completingOrderIdRef.current === orderId) {
      return;
    }

    try {
      completingOrderIdRef.current = orderId;
      setCompletingOrderId(orderId);
      setError(null);
      await orderRepository.completeOrder(orderId);
      await loadCityData();
    } catch (value) {
      setError(formatError(value).message);
    } finally {
      completingOrderIdRef.current = null;
      setCompletingOrderId(null);
    }
  }

  // Renaming a city bulk-updates every customer currently grouped under it
  // and renames the persisted city entity itself. Returns the new normalized
  // city so the caller can navigate to it.
  const renameCity = useCallback(async (newName: string) => {
    try {
      setRenaming(true);
      setError(null);
      const customers = await customerRepository.getCustomersByNormalizedCity(normalizedCity);
      await Promise.all([
        ...customers.map((customer) => customerRepository.updateCustomer(customer.id, { city: newName })),
        cityRepository.renameCityEntity(normalizedCity, newName),
      ]);
      return normalizeCity(newName);
    } catch (value) {
      setError(formatError(value).message);
      return null;
    } finally {
      setRenaming(false);
    }
  }, [normalizedCity]);

  // Deletes only the city entity, not its customers. cityRepository blocks
  // this while any customer is still assigned to the city — otherwise the
  // very next list refresh would just recreate the entity (see
  // cityRepository.ensureCityExists), which looked to users like the delete
  // silently didn't work.
  const deleteCity = useCallback(async () => {
    if (!cityEntity) {
      return false;
    }

    try {
      setDeleting(true);
      setError(null);
      await cityRepository.deleteCity(cityEntity.id);
      return true;
    } catch (value) {
      setError(formatError(value).message);
      return false;
    } finally {
      setDeleting(false);
    }
  }, [cityEntity]);

  // Deletes an individual customer (and their orders, per customerRepository)
  // so a city that's blocked from deletion by having customers assigned can
  // be cleared out one by one.
  const deleteCustomer = useCallback(async (customerId: string) => {
    try {
      setDeletingCustomerId(customerId);
      setError(null);
      await customerRepository.deleteCustomer(customerId);
      await loadCityData();
      return true;
    } catch (value) {
      setError(formatError(value).message);
      return false;
    } finally {
      setDeletingCustomerId(null);
    }
  }, [loadCityData]);

  const customers = useMemo(
    () => filterCityCustomerItems(items, searchTerm),
    [items, searchTerm],
  );

  return {
    loading,
    error,
    searchTerm,
    setSearchTerm,
    productTotals,
    completeOrder,
    completingOrderId,
    cityDisplayName: cityEntity?.name ?? "",
    customerCount: items.length,
    renaming,
    renameCity,
    deleting,
    deleteCity,
    deletingCustomerId,
    deleteCustomer,
    reload: loadCityData,
    customers,
  };
}
