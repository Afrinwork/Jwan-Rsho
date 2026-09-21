import { useCallback, useEffect, useMemo, useState } from "react";

import { customerRepository } from "@/src/repositories/customerRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { Customer } from "@/src/types/customer";
import { formatError } from "@/src/utils/formatError";

export type CustomerListMode = "all" | "openOrders";

export function useManagementCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [openOrderCustomerIds, setOpenOrderCustomerIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<CustomerListMode>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [nextCustomers, openOrders] = await Promise.all([
        customerRepository.getCustomers(),
        orderRepository.getOpenOrders(),
      ]);
      setCustomers(nextCustomers);
      setOpenOrderCustomerIds(new Set(openOrders.map((order) => order.customerId)));
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
    const modeCustomers = mode === "openOrders" ? customers.filter((customer) => openOrderCustomerIds.has(customer.id)) : customers;

    if (!term) {
      return modeCustomers;
    }

    return modeCustomers.filter((customer) =>
      [customer.fullName, customer.phone, customer.city, customer.address].some((value) => value.toLowerCase().includes(term)),
    );
  }, [customers, mode, openOrderCustomerIds, query]);

  const openOrdersCustomerCount = useMemo(
    () => customers.filter((customer) => openOrderCustomerIds.has(customer.id)).length,
    [customers, openOrderCustomerIds],
  );

  const deleteCustomer = useCallback(async (customerId: string) => {
    try {
      setDeletingId(customerId);
      setError(null);
      await customerRepository.deleteCustomer(customerId);
      await load();
      return true;
    } catch (value) {
      setError(formatError(value).message);
      return false;
    } finally {
      setDeletingId(null);
    }
  }, [load]);

  return {
    customers: filteredCustomers,
    totalCount: customers.length,
    openOrdersCustomerCount,
    mode,
    setMode,
    query,
    setQuery,
    loading,
    error,
    reload: load,
    deletingId,
    deleteCustomer,
  };
}
