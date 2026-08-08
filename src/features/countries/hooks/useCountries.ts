import { useCallback, useEffect, useState } from "react";

import { countryRepository } from "@/src/repositories/countryRepository";
import { CountryWrite } from "@/src/repositories/countryRepositoryData";
import { Country } from "@/src/types/country";
import { formatError } from "@/src/utils/formatError";

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setCountries(await countryRepository.getCountries());
      setError(null);
    } catch (value) {
      setError(formatError(value).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [load]);

  const addCountry = useCallback(async (input: CountryWrite) => {
    await countryRepository.createCountry(input);
    await load();
  }, [load]);

  const updateCountry = useCallback(async (id: string, input: Partial<CountryWrite>) => {
    await countryRepository.updateCountry(id, input);
    await load();
  }, [load]);

  const toggleActive = useCallback(async (country: Country) => {
    await countryRepository.updateCountry(country.id, { isActive: !country.isActive });
    await load();
  }, [load]);

  return { countries, loading, error, addCountry, updateCountry, toggleActive };
}
