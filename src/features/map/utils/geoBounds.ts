import { LatLng } from "@/src/features/map/types/mapViewTypes";

// [west, south, east, north] — the tuple shape MapLibre's Camera.fitBounds expects.
export type LngLatBoundsTuple = [west: number, south: number, east: number, north: number];

// Only used by AppMapView.android.tsx, to translate the same coordinate list
// react-native-maps' fitToCoordinates already takes into the bounding box
// MapLibre's Camera.fitBounds wants instead.
export function boundsFromCoordinates(coordinates: LatLng[]): LngLatBoundsTuple {
  const [first, ...rest] = coordinates;
  let west = first.longitude;
  let east = first.longitude;
  let south = first.latitude;
  let north = first.latitude;

  for (const point of rest) {
    if (point.longitude < west) west = point.longitude;
    if (point.longitude > east) east = point.longitude;
    if (point.latitude < south) south = point.latitude;
    if (point.latitude > north) north = point.latitude;
  }

  return [west, south, east, north];
}
