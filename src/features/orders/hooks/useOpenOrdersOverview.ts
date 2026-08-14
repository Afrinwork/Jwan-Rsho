import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { customerRepository } from "@/src/repositories/customerRepository";
import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { Customer } from "@/src/types/customer";
import { OrderWithItems } from "@/src/types/order";
import { formatError } from "@/src/utils/formatError";

export type CustomerOpenOrders = {
  customer: Customer;
  orders: OrderWithItems[];
};

export function useOpenOrdersOverview() {
  const [groups, setGroups] = useState<CustomerOpenOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingActionOrderId, setPendingActionOrderId] = useState<string | null>(null);
  const [pendingActionType, setPendingActionType] = useState<"complete" | "delete" | null>(null);
  const pendingActionOrderIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const openOrders = await orderRepository.getOpenOrders();
      const customerIds = [...new Set(openOrders.map((value) => value.customerId))];
      const [ordersWithItems, customers] = await Promise.all([
        orderDetailsRepository.getOpenOrdersWithItemsByCustomerIds(customerIds),
        customerRepository.getCustomersByIds(customerIds),
      ]);

      setGroups(groupByCustomer(ordersWithItems, customers));
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

  const completeOrder = useCallback(async (orderId: string) => {
    if (pendingActionOrderIdRef.current === orderId) {
      return;
    }

    try {
      pendingActionOrderIdRef.current = orderId;
      setPendingActionOrderId(orderId);
      setPendingActionType("complete");
      setActionError(null);
      await orderRepository.completeOrder(orderId);
      await load();
    } catch (value) {
      setActionError(formatError(value).message);
    } finally {
      pendingActionOrderIdRef.current = null;
      setPendingActionOrderId(null);
      setPendingActionType(null);
    }
  }, [load]);

  const deleteOrder = useCallback(async (orderId: string) => {
    if (pendingActionOrderIdRef.current === orderId) {
      return;
    }

    try {
      pendingActionOrderIdRef.current = orderId;
      setPendingActionOrderId(orderId);
      setPendingActionType("delete");
      setActionError(null);
      await orderRepository.deleteOrder(orderId);
      await load();
    } catch (value) {
      setActionError(formatError(value).message);
    } finally {
      pendingActionOrderIdRef.current = null;
      setPendingActionOrderId(null);
      setPendingActionType(null);
    }
  }, [load]);

  const cities = useMemo(
    () => [...new Set(groups.map((value) => value.customer.city.trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right, "de")),
    [groups],
  );

  return {
    groups,
    cities,
    loading,
    error,
    actionError,
    completeOrder,
    deleteOrder,
    pendingActionOrderId,
    pendingActionType,
    reload: load,
  };
}

function groupByCustomer(orders: OrderWithItems[], customers: Customer[]): CustomerOpenOrders[] {
  const customerById = new Map(customers.map((value) => [value.id, value]));
  const ordersByCustomerId = new Map<string, OrderWithItems[]>();

  for (const order of orders) {
    const list = ordersByCustomerId.get(order.customerId) ?? [];
    list.push(order);
    ordersByCustomerId.set(order.customerId, list);
  }

  const groups: CustomerOpenOrders[] = [];

  for (const [customerId, customerOrders] of ordersByCustomerId) {
    const customer = customerById.get(customerId);

    if (!customer) {
      continue;
    }

    groups.push({
      customer,
      orders: [...customerOrders].sort((left, right) => right.orderedAt.localeCompare(left.orderedAt)),
    });
  }

  return groups.sort((left, right) => left.customer.fullName.localeCompare(right.customer.fullName, "de"));
}
