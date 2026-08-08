import { Customer } from "@/src/types/customer";
import { Order } from "@/src/types/order";
import { normalizeCity } from "@/src/utils/normalizeCity";

import { CitySummary } from "@/src/features/cities/types/cityTypes";

export function buildCitySummaries(customers: Customer[], orders: Order[]) {
  const summaryMap = new Map<string, CitySummary>();
  const customerCityMap = new Map(customers.map((value) => [value.id, normalizeCity(value.city)]));

  customers.forEach((value) => {
    const normalizedName = normalizeCity(value.city);
    const current = summaryMap.get(normalizedName);
    summaryMap.set(normalizedName, {
      name: current?.name ?? value.city.trim(),
      normalizedName,
      country: value.country,
      customerCount: (current?.customerCount ?? 0) + 1,
      openOrderCount: current?.openOrderCount ?? 0,
    });
  });

  orders.forEach((value) => {
    const normalizedName = customerCityMap.get(value.customerId);
    if (!normalizedName || value.status !== "open") {
      return;
    }

    const current = summaryMap.get(normalizedName);
    if (!current) {
      return;
    }

    summaryMap.set(normalizedName, {
      ...current,
      openOrderCount: current.openOrderCount + 1,
    });
  });

  return [...summaryMap.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export function filterCitySummaries(summaries: CitySummary[], searchTerm: string, country: string) {
  const normalizedSearch = normalizeCity(searchTerm);
  return summaries.filter((value) => {
    const matchesSearch = !normalizedSearch || value.normalizedName.includes(normalizedSearch);
    const matchesCountry = !country || value.country === country;
    return matchesSearch && matchesCountry;
  });
}

export function getCountryOptions(summaries: CitySummary[]) {
  return [...new Set(summaries.map((value) => value.country))].sort();
}
