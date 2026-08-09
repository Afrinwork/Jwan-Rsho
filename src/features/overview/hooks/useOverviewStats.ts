import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { requireCurrentUserId, requireDb } from "@/src/repositories/repositoryContext";
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

  useEffect(() => {
    let active = true;

    try {
      const db = requireDb();
      const ownerId = requireCurrentUserId();
      const customersQuery = query(collection(db, "customers"), where("ownerId", "==", ownerId));
      const ordersQuery = query(collection(db, "orders"), where("ownerId", "==", ownerId));
      const countriesQuery = query(collection(db, "countries"), where("ownerId", "==", ownerId));
      const productsQuery = query(collection(db, "products"), where("ownerId", "==", ownerId));
      let customers: Customer[] = [];
      let orders: Order[] = [];
      let countries: Country[] = [];
      let products: Product[] = [];

      const updateStats = () => {
        if (!active) {
          return;
        }

        setStats(buildOverviewStats(customers, orders, countries, products));
        setError(null);
        setLoading(false);
      };

      const handleError = (value: unknown) => {
        if (!active) {
          return;
        }

        setError(formatError(value).message);
        setLoading(false);
      };

      const unsubscribers = [
        onSnapshot(
          customersQuery,
          (snapshot) => {
            customers = snapshot.docs.map((value) => ({ id: value.id, ...value.data() }) as Customer);
            updateStats();
          },
          handleError,
        ),
        onSnapshot(
          ordersQuery,
          (snapshot) => {
            orders = snapshot.docs.map((value) => ({ id: value.id, ...value.data() }) as Order);
            updateStats();
          },
          handleError,
        ),
        onSnapshot(
          countriesQuery,
          (snapshot) => {
            countries = snapshot.docs.map((value) => ({ id: value.id, ...value.data() }) as Country);
            updateStats();
          },
          handleError,
        ),
        onSnapshot(
          productsQuery,
          (snapshot) => {
            products = snapshot.docs.map((value) => ({ id: value.id, ...value.data() }) as Product);
            updateStats();
          },
          handleError,
        ),
      ];

      return () => {
        active = false;
        unsubscribers.forEach((unsubscribe) => unsubscribe());
      };
    } catch (value) {
      setError(formatError(value).message);
      setLoading(false);
      return () => {
        active = false;
      };
    }
  }, []);

  return { stats, loading, error };
}

function buildOverviewStats(customers: Customer[], orders: Order[], countries: Country[], products: Product[]): OverviewStats {
  const cityCount = new Set(customers.map((value) => value.normalizedCity).filter(Boolean)).size;

  return {
    customers: customers.length,
    openOrders: orders.filter((value) => value.status === "open").length,
    completedOrders: orders.filter((value) => value.status === "completed").length,
    countries: countries.filter((value) => value.isActive).length,
    cities: cityCount,
    products: products.filter((value) => value.isActive).length,
  };
}
