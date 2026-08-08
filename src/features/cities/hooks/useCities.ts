import { useEffect, useState } from "react";

import { customerRepository } from "@/src/repositories/customerRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { formatError } from "@/src/utils/formatError";

import { buildCitySummaries, filterCitySummaries, getCountryOptions } from "@/src/features/cities/services/cityService";
import { CitySummary } from "@/src/features/cities/types/cityTypes";

export function useCities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<CitySummary[]>([]);

  useEffect(() => {
    Promise.all([customerRepository.getCustomers(), orderRepository.getOpenOrders()])
      .then(([customers, orders]) => setSummaries(buildCitySummaries(customers, orders)))
      .catch((value) => setError(formatError(value).message))
      .finally(() => setLoading(false));
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
