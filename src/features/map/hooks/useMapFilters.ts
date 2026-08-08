import { useMemo, useState } from "react";

import {
  filterMapMarkers,
  getMapCityOptions,
  getMapCountryOptions,
  getMapRegionOptions,
} from "@/src/features/map/services/mapFilterService";
import { MapCustomerMarker, MapFilterState } from "@/src/features/map/types/mapTypes";

const defaultFilters: MapFilterState = {
  country: "",
  city: "",
  region: "",
};

export function useMapFilters(markers: MapCustomerMarker[]) {
  const [filters, setFilters] = useState<MapFilterState>(defaultFilters);

  const filteredMarkers = useMemo(
    () => filterMapMarkers(markers, filters),
    [filters, markers],
  );

  const countryOptions = useMemo(() => getMapCountryOptions(markers), [markers]);
  const cityOptions = useMemo(() => getMapCityOptions(markers, filters), [filters, markers]);
  const regionOptions = useMemo(() => getMapRegionOptions(markers, filters), [filters, markers]);

  function selectCountry(country: string) {
    setFilters({ country, city: "", region: "" });
  }

  function selectCity(city: string) {
    setFilters((current) => ({ ...current, city, region: "" }));
  }

  function selectRegion(region: string) {
    setFilters((current) => ({ ...current, region }));
  }

  function resetFilters() {
    setFilters(defaultFilters);
  }

  return {
    filters,
    filteredMarkers,
    countryOptions,
    cityOptions,
    regionOptions,
    selectCountry,
    selectCity,
    selectRegion,
    resetFilters,
  };
}
