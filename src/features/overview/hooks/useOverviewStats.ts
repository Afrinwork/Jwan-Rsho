import { useEffect, useState } from "react";

import { countryRepository } from "@/src/repositories/countryRepository";
import { customerRepository } from "@/src/repositories/customerRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { productRepository } from "@/src/repositories/productRepository";
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

  useEffect(() => {
    let active = true;

    Promise.all([
      customerRepository.getCustomers(),
      orderRepository.getOrders(),
      countryRepository.getCountries(),
      productRepository.getProducts(),
    ])
      .then(([customers, orders, countries, products]) => {
        if (!active) {
          return;
        }

        const cityCount = new Set(
          customers.map((value) => value.normalizedCity).filter(Boolean),
        ).size;

        setStats({
          customers: customers.length,
          openOrders: orders.filter((value) => value.status === "open").length,
          completedOrders: orders.filter((value) => value.status === "completed").length,
          countries: countries.filter((value) => value.isActive).length,
          cities: cityCount,
          products: products.filter((value) => value.isActive).length,
        });
        setError(null);
      })
      .catch((value) => {
        if (active) {
          setError(formatError(value).message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { stats, loading, error };
}
