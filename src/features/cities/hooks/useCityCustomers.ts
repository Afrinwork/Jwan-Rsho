import { useCallback, useEffect, useState } from "react";

import { customerRepository } from "@/src/repositories/customerRepository";
import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { formatError } from "@/src/utils/formatError";

import { buildCityCustomerItems, filterCityCustomerItems } from "@/src/features/cities/services/cityCustomerService";
import { buildCityProductTotals } from "@/src/features/cities/services/cityProductTotalsService";
import { CityCustomerItem } from "@/src/features/cities/types/cityCustomerTypes";
import { CityProductTotal } from "@/src/features/cities/types/cityProductTotalTypes";

export function useCityCustomers(normalizedCity: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [items, setItems] = useState<CityCustomerItem[]>([]);
  const [productTotals, setProductTotals] = useState<CityProductTotal[]>([]);
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);

  const loadCityData = useCallback(async () => {
    const customers = await customerRepository.getCustomersByNormalizedCity(normalizedCity);
    const orders = await orderRepository.getOrders();
    setItems(buildCityCustomerItems(customers, orders));
    const openOrders = await orderDetailsRepository.getOpenOrdersWithItemsByCustomerIds(
      customers.map((value) => value.id),
    );
    setProductTotals(buildCityProductTotals(openOrders));
  }, [normalizedCity]);

  useEffect(() => {
    customerRepository
      .getCustomersByNormalizedCity(normalizedCity)
      .then(() => loadCityData())
      .catch((value) => setError(formatError(value).message))
      .finally(() => setLoading(false));
  }, [loadCityData, normalizedCity]);

  async function completeOrder(orderId: string) {
    if (completingOrderId === orderId) {
      return;
    }

    try {
      setCompletingOrderId(orderId);
      setError(null);
      await orderRepository.completeOrder(orderId);
      await loadCityData();
    } catch (value) {
      setError(formatError(value).message);
    } finally {
      setCompletingOrderId(null);
    }
  }

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
    customers: filterCityCustomerItems(items, searchTerm, status),
  };
}
