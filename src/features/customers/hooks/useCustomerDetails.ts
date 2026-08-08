import { useEffect, useState } from "react";

import { customerRepository } from "@/src/repositories/customerRepository";
import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { Customer } from "@/src/types/customer";
import { OrderWithItems } from "@/src/types/order";
import { formatError } from "@/src/utils/formatError";

import { splitCustomerOrders } from "@/src/features/customers/services/customerDetailsService";

export function useCustomerDetails(customerId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [openOrders, setOpenOrders] = useState<OrderWithItems[]>([]);
  const [historyOrders, setHistoryOrders] = useState<OrderWithItems[]>([]);

  useEffect(() => {
    Promise.all([
      customerRepository.getCustomerById(customerId),
      orderDetailsRepository.getOrdersByCustomerWithItems(customerId),
    ])
      .then(([loadedCustomer, loadedOrders]) => {
        const sections = splitCustomerOrders(loadedOrders);
        setCustomer(loadedCustomer);
        setOpenOrders(sections.openOrders);
        setHistoryOrders(sections.historyOrders);
      })
      .catch((value) => setError(formatError(value).message))
      .finally(() => setLoading(false));
  }, [customerId]);

  return { loading, error, customer, openOrders, historyOrders };
}
