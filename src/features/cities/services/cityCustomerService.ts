import { Customer } from "@/src/types/customer";
import { Order } from "@/src/types/order";

import { CityCustomerItem, CityCustomerStatus } from "@/src/features/cities/types/cityCustomerTypes";

export function buildCityCustomerItems(customers: Customer[], orders: Order[]) {
  return customers
    .map((value) => buildCityCustomerItem(value, orders.filter((item) => item.customerId === value.id)))
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
}

export function filterCityCustomerItems(items: CityCustomerItem[], searchTerm: string, status: string) {
  const term = searchTerm.trim().toLowerCase();
  return items.filter((value) => {
    const matchesSearch = !term || [value.fullName, value.phone, value.address].some((field) => field.toLowerCase().includes(term));
    const matchesStatus = status === "all" || value.status === status;
    return matchesSearch && matchesStatus;
  });
}

function buildCityCustomerItem(customer: Customer, orders: Order[]): CityCustomerItem {
  const openOrder = [...orders]
    .filter((value) => value.status === "open")
    .sort((left, right) => right.orderedAt.localeCompare(left.orderedAt))[0];

  return {
    id: customer.id,
    fullName: customer.fullName,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    currentOpenOrderId: openOrder?.id ?? null,
    currentOpenOrderLabel: openOrder ? formatOpenOrderLabel(openOrder.orderedAt) : null,
    status: resolveStatus(orders),
  };
}

function resolveStatus(orders: Order[]): CityCustomerStatus {
  if (orders.some((value) => value.status === "open")) {
    return "open";
  }

  if (orders.some((value) => value.status === "completed")) {
    return "completed";
  }

  return "no-open-order";
}

function formatOpenOrderLabel(orderedAt: string) {
  return `Offen seit ${new Date(orderedAt).toLocaleDateString()}`;
}
