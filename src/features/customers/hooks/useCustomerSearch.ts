import { useEffect, useState } from "react";

import { customerRepository } from "@/src/repositories/customerRepository";
import { Customer } from "@/src/types/customer";
import { formatError } from "@/src/utils/formatError";

const DEBOUNCE_MS = 300;

export function useCustomerSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!trimmedQuery) {
      return;
    }

    let active = true;

    const timeout = setTimeout(() => {
      if (active) {
        setLoading(true);
      }

      customerRepository
        .searchCustomers(trimmedQuery)
        .then((value) => {
          if (active) {
            setResults(value);
            setError(null);
          }
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
    }, DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [trimmedQuery]);

  return {
    query,
    setQuery,
    results: trimmedQuery ? results : [],
    loading: trimmedQuery ? loading : false,
    error: trimmedQuery ? error : null,
  };
}
