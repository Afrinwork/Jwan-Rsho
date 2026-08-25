import { useMemo, useState } from "react";

import {
  filterMapMarkers,
  getMapCityOptions,
  getMapCountryOptions,
} from "@/src/features/map/services/mapFilterService";
import { MapCustomerMarker, MapFilterState } from "@/src/features/map/types/mapTypes";

const defaultFilters: MapFilterState = {
  country: "",
  city: "",
};

export function useMapFilters(markers: MapCustomerMarker[]) {
  const [filters, setFilters] = useState<MapFilterState>(defaultFilters);

  const filteredMarkers = useMemo(
    () => filterMapMarkers(markers, filters),
    [filters, markers],
  );

  const countryOptions = useMemo(() => getMapCountryOptions(markers), [markers]);
  const cityOptions = useMemo(() => getMapCityOptions(markers, filters), [filters, markers]);

  function selectCountry(country: string) {
    setFilters({ country, city: "" });
  }

  function selectCity(city: string) {
    setFilters((current) => ({ ...current, city }));
  }

  function resetFilters() {
    setFilters(defaultFilters);
  }

  return {
    filters,
    filteredMarkers,
    countryOptions,
    cityOptions,
    selectCountry,
    selectCity,
    resetFilters,
  };
}
