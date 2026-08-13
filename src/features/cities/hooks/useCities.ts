import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { cityRepository } from "@/src/repositories/cityRepository";
import { customerRepository } from "@/src/repositories/customerRepository";
import { requireCurrentUserId, requireDb } from "@/src/repositories/repositoryContext";
import { formatError } from "@/src/utils/formatError";
import { normalizeCity } from "@/src/utils/normalizeCity";

import { buildCitySummaries, filterCitySummaries, getCountryOptions } from "@/src/features/cities/services/cityService";
import { CitySummary } from "@/src/features/cities/types/cityTypes";
import { City } from "@/src/types/city";
import { Customer } from "@/src/types/customer";
import { Order } from "@/src/types/order";

export function useCities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<CitySummary[]>([]);

  useEffect(() => {
    let active = true;

    void backfillMissingCityEntities();

    try {
      const db = requireDb();
      const ownerId = requireCurrentUserId();
      const citiesQuery = query(collection(db, "cities"), where("ownerId", "==", ownerId));
      const customersQuery = query(collection(db, "customers"), where("ownerId", "==", ownerId));
      const openOrdersQuery = query(collection(db, "orders"), where("ownerId", "==", ownerId), where("status", "==", "open"));
      let cities: City[] = [];
      let customers: Customer[] = [];
      let orders: Order[] = [];

      const updateSummaries = () => {
        if (!active) {
          return;
        }

        setSummaries(buildCitySummaries(cities, customers, orders));
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
          citiesQuery,
          (snapshot) => {
            cities = snapshot.docs.map((value) => ({ id: value.id, ...value.data() }) as City);
            updateSummaries();
          },
          handleError,
        ),
        onSnapshot(
          customersQuery,
          (snapshot) => {
            customers = snapshot.docs.map((value) => ({ id: value.id, ...value.data() }) as Customer);
            updateSummaries();
          },
          handleError,
        ),
        onSnapshot(
          openOrdersQuery,
          (snapshot) => {
            orders = snapshot.docs.map((value) => ({ id: value.id, ...value.data() }) as Order);
            updateSummaries();
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

  return {
    loading,
    error,
    searchTerm,
    setSearchTerm,
    country,
    setCountry,
    countryOptions: getCountryOptions(summaries),
    cities: filterCitySummaries(summaries, searchTerm, country),
  };
}

// One-time self-heal for customers whose city predates city entities being
// tracked — creates the missing City doc so it shows up going forward too.
async function backfillMissingCityEntities() {
  try {
    const [cities, customers] = await Promise.all([cityRepository.getCities(), customerRepository.getCustomers()]);
    const known = new Set(cities.map((value) => value.normalizedName));
    const missing = new Map<string, string>();

    for (const customer of customers) {
      const normalized = normalizeCity(customer.city);

      if (normalized && !known.has(normalized) && !missing.has(normalized)) {
        missing.set(normalized, customer.city.trim());
      }
    }

    await Promise.all([...missing.values()].map((name) => cityRepository.ensureCityExists(name)));
  } catch {
    // Best-effort — the live listeners above still work off whatever already exists.
  }
}
