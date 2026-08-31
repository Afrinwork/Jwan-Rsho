import { useCallback, useEffect, useMemo, useState } from "react";

import { customerRepository } from "@/src/repositories/customerRepository";
import { Customer } from "@/src/types/customer";
import { formatError } from "@/src/utils/formatError";

export function useManagementCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setCustomers(await customerRepository.getCustomers());
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

  const filteredCustomers = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.fullName, customer.phone, customer.city, customer.address].some((value) => value.toLowerCase().includes(term)),
    );
  }, [customers, query]);

  return {
    customers: filteredCustomers,
    totalCount: customers.length,
    query,
    setQuery,
    loading,
    error,
    reload: load,
  };
}
