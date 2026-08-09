import { useCallback, useEffect, useState } from "react";

import { customerRepository } from "@/src/repositories/customerRepository";
import { formatError } from "@/src/utils/formatError";
import { normalizeCity } from "@/src/utils/normalizeCity";

export type CustomerCityOption = {
  city: string;
  country: string;
  normalizedCity: string;
};

export function useCustomerCities() {
  const [cities, setCities] = useState<CustomerCityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const customers = await customerRepository.getCustomers();
      const cityMap = new Map<string, CustomerCityOption>();

      customers.forEach((customer) => {
        const normalized = normalizeCity(customer.city);
        const key = `${customer.country.trim().toLowerCase()}::${normalized}`;

        if (!normalized || cityMap.has(key)) {
          return;
        }

        cityMap.set(key, {
          city: customer.city.trim(),
          country: customer.country.trim(),
          normalizedCity: normalized,
        });
      });

      setCities(
        [...cityMap.values()].sort((left, right) => left.city.localeCompare(right.city, "de")),
      );
      setError(null);
    } catch (value) {
      setError(formatError(value).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { cities, loading, error };
}
