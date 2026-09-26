import { useEffect, useState } from "react";

import { orderRepository } from "@/src/repositories/orderRepository";
import { buildDriverOpenCustomers, DriverOpenCustomers } from "@/src/features/admin/services/driverOpenCustomersService";

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && right.every((id) => left.includes(id));
}

// Live list of the customers that currently have an open order assigned to
// `driverId` — the admin driver view starts from the dashboard's snapshot
// (`initialIds`) and then follows assignments/completions/hiding as they
// happen, instead of staying frozen on whatever was open when it was opened.
export function useDriverOpenCustomerIds(driverId: string, initialIds: string[]) {
  const [state, setState] = useState<DriverOpenCustomers>(() => ({ customerIds: initialIds, hiddenCustomerIds: new Set() }));

  useEffect(() => {
    if (!driverId) return;

    return orderRepository.subscribeToOpenOrders(
      (orders) => {
        const next = buildDriverOpenCustomers(orders, driverId);
        // Keep the previous id array when the set didn't change, so the
        // marker fetch keyed on it doesn't reload for unrelated orders.
        setState((current) => ({
          customerIds: sameIds(current.customerIds, next.customerIds) ? current.customerIds : next.customerIds,
          hiddenCustomerIds: next.hiddenCustomerIds,
        }));
      },
      () => undefined,
    );
  }, [driverId]);

  return state;
}
