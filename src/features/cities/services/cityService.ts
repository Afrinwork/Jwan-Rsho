import { City } from "@/src/types/city";
import { Customer } from "@/src/types/customer";
import { Order } from "@/src/types/order";
import { normalizeCity } from "@/src/utils/normalizeCity";

import { CitySummary } from "@/src/features/cities/types/cityTypes";

// Cities are persisted entities (see cityRepository), seeded here first so a
// city stays visible even once it has zero customers. Customer/order data is
// then merged in on top to fill in counts (and cover any not-yet-backfilled
// legacy city that doesn't have an entity yet).
export function buildCitySummaries(cities: City[], customers: Customer[], orders: Order[]) {
  const summaryMap = new Map<string, CitySummary>();
  const customerCityMap = new Map(customers.map((value) => [value.id, normalizeCity(value.city)]));

  cities.forEach((city) => {
    summaryMap.set(city.normalizedName, {
      id: city.id,
      name: city.name,
      nameAr: city.nameAr,
      normalizedName: city.normalizedName,
      country: "",
      customerCount: 0,
      openOrderCount: 0,
    });
  });

  customers.forEach((value) => {
    const normalizedName = normalizeCity(value.city);

    if (!normalizedName) {
      return;
    }

    const current = summaryMap.get(normalizedName);
    summaryMap.set(normalizedName, {
      id: current?.id ?? "",
      name: current?.name ?? value.city.trim(),
      nameAr: current?.nameAr,
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

  return [...summaryMap.values()].sort((left, right) => left.name.localeCompare(right.name, "de"));
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
  return [...new Set(summaries.map((value) => value.country).filter(Boolean))].sort((left, right) => left.localeCompare(right, "de"));
}
