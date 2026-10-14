import { useEffect, useMemo, useState } from "react";

import { customerRepository } from "@/src/repositories/customerRepository";
import { Customer } from "@/src/types/customer";

// All customers of the account, loaded once per debt-book visit: to pick
// the customer of a new debt and to show the current address/phone of the
// customer a debt belongs to.
export function useCustomerDirectory() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    let active = true;
    customerRepository
      .getCustomers()
      .then((loaded) => {
        if (active) setCustomers(loaded);
      })
      // Without the list the debt book still works with typed names.
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const byId = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  return { customers, byId };
}

export function searchCustomers(customers: Customer[], term: string, limit = 8) {
  const needle = term.trim().toLowerCase();
  if (!needle) return [];
  return customers
    .filter((customer) =>
      [customer.fullName, customer.phone, customer.city, customer.address].some((field) => field?.toLowerCase().includes(needle)),
    )
    .slice(0, limit);
}
