import { useCallback, useEffect, useRef, useState } from "react";

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
  const [status, setStatus] = useState("all");
  const [items, setItems] = useState<CityCustomerItem[]>([]);
  const [cityEntity, setCityEntity] = useState<City | null>(null);
  const [productTotals, setProductTotals] = useState<CityProductTotal[]>([]);
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  // Deletes only the city entity, not its customers — they simply keep their
  // city text, and saving any of them again would recreate the entity.
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

  return {
    loading,
    error,
    searchTerm,
    setSearchTerm,
    status,
    setStatus,
    productTotals,
    completeOrder,
    completingOrderId,
    cityDisplayName: cityEntity?.name ?? "",
    renaming,
    renameCity,
    deleting,
    deleteCity,
    customers: filterCityCustomerItems(items, searchTerm, status),
  };
}
