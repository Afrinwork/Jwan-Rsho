import { MapCustomerMarker, MapFilterState } from "@/src/features/map/types/mapTypes";

export function filterMapMarkers(markers: MapCustomerMarker[], filters: MapFilterState) {
  return markers.filter((marker) => {
    const matchesCountry = !filters.country || marker.country === filters.country;
    const matchesCity = !filters.city || marker.city === filters.city;
    return matchesCountry && matchesCity;
  });
}

export function getMapCountryOptions(markers: MapCustomerMarker[]) {
  return getUniqueValues(markers.map((marker) => marker.country));
}

export function getMapCityOptions(markers: MapCustomerMarker[], filters: MapFilterState) {
  return getUniqueValues(
    markers
      .filter((marker) => !filters.country || marker.country === filters.country)
      .map((marker) => marker.city),
  );
}

function getUniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}
