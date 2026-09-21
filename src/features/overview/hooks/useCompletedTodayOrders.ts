import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { customerRepository } from "@/src/repositories/customerRepository";
import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { OrderWithItems } from "@/src/types/order";
import { formatError } from "@/src/utils/formatError";

import { buildCompletedTodayEntries, filterCompletedTodayEntries } from "@/src/features/overview/services/completedTodayService";
import { CompletedTodayEntry } from "@/src/features/overview/types/completedTodayTypes";

export function useCompletedTodayOrders() {
  const { t } = useTranslation("overview");
  const [entries, setEntries] = useState<CompletedTodayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const deletingOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = orderDetailsRepository.subscribeToCompletedOrdersTodayWithItems(
      (orders) => {
        void joinCustomers(orders);
      },
      (value) => {
        if (cancelled) {
          return;
        }
        setError(formatError(value).message);
        setLoading(false);
      },
    );

    async function joinCustomers(orders: OrderWithItems[]) {
      try {
        const customerIds = [...new Set(orders.map((value) => value.customerId))];
        const customers = await customerRepository.getCustomersByIds(customerIds);
        if (cancelled) {
          return;
        }
        setEntries(buildCompletedTodayEntries(orders, customers));
        setError(null);
      } catch (value) {
        if (!cancelled) {
          setError(formatError(value).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const filteredEntries = useMemo(() => filterCompletedTodayEntries(entries, searchTerm), [entries, searchTerm]);

  // No manual "reload" here on purpose: the live subscription above is the
  // single source of truth for this list, so it already reflects the real
  // Firestore state after every delete — including a partial failure, where
  // whichever orders didn't actually get deleted simply keep showing up.
  const deleteEntry = useCallback(async (orderId: string) => {
    if (deletingOrderIdRef.current === orderId) {
      return;
    }

    try {
      deletingOrderIdRef.current = orderId;
      setDeletingOrderId(orderId);
      setActionError(null);
      await orderRepository.deleteCompletedOrder(orderId);
    } catch (value) {
      setActionError(formatError(value).message);
    } finally {
      deletingOrderIdRef.current = null;
      setDeletingOrderId(null);
    }
  }, []);

  const deleteAll = useCallback(async () => {
    if (entries.length === 0) {
      return;
    }

    setDeletingAll(true);
    setActionError(null);

    const results = await Promise.allSettled(entries.map((entry) => orderRepository.deleteCompletedOrder(entry.orderId)));
    const failedCount = results.filter((value) => value.status === "rejected").length;

    if (failedCount > 0) {
      setActionError(t("completedToday.deleteAllPartialError", { failedCount, totalCount: entries.length }));
    }

    setDeletingAll(false);
  }, [entries, t]);

  return {
    entries: filteredEntries,
    totalCount: entries.length,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    deletingOrderId,
    deletingAll,
    actionError,
    deleteEntry,
    deleteAll,
  };
}
