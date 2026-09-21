import { Customer } from "@/src/types/customer";
import { OrderWithItems } from "@/src/types/order";

import { CompletedTodayEntry } from "@/src/features/overview/types/completedTodayTypes";

export function buildCompletedTodayEntries(orders: OrderWithItems[], customers: Customer[]): CompletedTodayEntry[] {
  const customerById = new Map(customers.map((value) => [value.id, value]));
  const entries: CompletedTodayEntry[] = [];

  for (const order of orders) {
    const customer = customerById.get(order.customerId);

    if (!customer || !order.completedAt) {
      continue;
    }

    entries.push({
      orderId: order.id,
      customerId: customer.id,
      customerName: customer.fullName,
      city: customer.city,
      address: customer.address,
      completedAt: order.completedAt,
      itemCount: order.items.length,
    });
  }

  return entries.sort((left, right) => right.completedAt.localeCompare(left.completedAt));
}

export function filterCompletedTodayEntries(entries: CompletedTodayEntry[], searchTerm: string): CompletedTodayEntry[] {
  const term = searchTerm.trim().toLowerCase();
  return term ? entries.filter((value) => value.customerName.toLowerCase().includes(term)) : entries;
}
