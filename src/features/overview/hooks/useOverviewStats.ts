import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { countryRepository } from "@/src/repositories/countryRepository";
import { customerRepository } from "@/src/repositories/customerRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { productRepository } from "@/src/repositories/productRepository";
import { dailyCompletionTracker } from "@/src/services/dailyCompletionTracker";
import { Country } from "@/src/types/country";
import { Customer } from "@/src/types/customer";
import { Order } from "@/src/types/order";
import { Product } from "@/src/types/product";
import { formatError } from "@/src/utils/formatError";

type OverviewStats = {
  customers: number;
  openOrders: number;
  completedOrders: number;
  countries: number;
  cities: number;
  products: number;
};

const emptyStats: OverviewStats = {
  customers: 0,
  openOrders: 0,
  completedOrders: 0,
  countries: 0,
  cities: 0,
  products: 0,
};

export function useOverviewStats() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      // Completed orders are deleted immediately (see orderRepository.completeOrder),
      // so "completed" is tracked separately as a rolling 24h count that resets on its own.
      const [customers, openOrders, countries, products, completedOrders] = await Promise.all([
        customerRepository.getCustomers(),
        orderRepository.getOpenOrders(),
        countryRepository.getCountries(),
        productRepository.getProducts(),
        dailyCompletionTracker.getCount(),
      ]);

      setStats({ ...buildOverviewStats(customers, openOrders, countries, products), completedOrders });
      setError(null);
    } catch (value) {
      setError(formatError(value).message);
    } finally {
      // Only the very first load should show the full-screen loading state —
      // focus-triggered refreshes below update stats silently in place.
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { stats, loading, error };
}

function buildOverviewStats(customers: Customer[], openOrders: Order[], countries: Country[], products: Product[]): Omit<OverviewStats, "completedOrders"> {
  const cityCount = new Set(customers.map((value) => value.normalizedCity).filter(Boolean)).size;

  return {
    customers: customers.length,
    openOrders: openOrders.length,
    countries: countries.filter((value) => value.isActive).length,
    cities: cityCount,
    products: products.filter((value) => value.isActive).length,
  };
}
