import { MapCustomerMarker, MapFilterState } from "@/src/features/map/types/mapTypes";

export function filterMapMarkers(markers: MapCustomerMarker[], filters: MapFilterState) {
  return markers.filter((marker) => {
    const matchesCountry = !filters.country || marker.country === filters.country;
    const matchesCity = !filters.city || marker.city === filters.city;
    const matchesRegion = !filters.region || marker.region === filters.region;
    return matchesCountry && matchesCity && matchesRegion;
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

export function getMapRegionOptions(markers: MapCustomerMarker[], filters: MapFilterState) {
  return getUniqueValues(
    markers
      .filter((marker) => !filters.country || marker.country === filters.country)
      .filter((marker) => !filters.city || marker.city === filters.city)
      .map((marker) => marker.region)
      .filter(Boolean),
  );
}

function getUniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}
