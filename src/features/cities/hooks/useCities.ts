import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { cityRepository } from "@/src/repositories/cityRepository";
import { customerRepository } from "@/src/repositories/customerRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { formatError } from "@/src/utils/formatError";
import { normalizeCity } from "@/src/utils/normalizeCity";

import { buildCitySummaries, filterCitySummaries, getCountryOptions } from "@/src/features/cities/services/cityService";
import { CitySummary } from "@/src/features/cities/types/cityTypes";
import { Customer } from "@/src/types/customer";

export function useCities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<CitySummary[]>([]);

  const load = useCallback(async () => {
    try {
      const [customers, openOrders] = await Promise.all([
        customerRepository.getCustomers(),
        orderRepository.getOpenOrders(),
      ]);

      await backfillMissingCityEntities(customers);
      const cities = await cityRepository.getCities();

      setSummaries(buildCitySummaries(cities, customers, openOrders));
      setError(null);
    } catch (value) {
      setError(formatError(value).message);
    } finally {
      // Only the very first load should show the full-screen loading state —
      // focus-triggered refreshes below update summaries silently in place.
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

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

// Self-heal for customers whose city predates city entities being tracked —
// creates any missing City docs so they show up going forward too. Best
// effort: failures here don't block the normal summary load above.
async function backfillMissingCityEntities(customers: Customer[]) {
  try {
    const cities = await cityRepository.getCities();
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
    // Best-effort — the normal load above still works off whatever already exists.
  }
}
