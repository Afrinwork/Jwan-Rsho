import { CityCustomerItem } from "@/src/features/cities/types/cityCustomerTypes";

export function toggleCustomerSelection(selectedIds: string[], customerId: string) {
  return selectedIds.includes(customerId)
    ? selectedIds.filter((value) => value !== customerId)
    : [...selectedIds, customerId];
}

export function selectAllCustomerIds(customers: CityCustomerItem[]) {
  return customers.map((value) => value.id);
}

export function resetCustomerSelection() {
  return [] as string[];
}
