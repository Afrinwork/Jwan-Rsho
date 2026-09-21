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

  // MapLibre cannot fit a zero-area bounding box reliably. This happens for
  // one stop, or when the driver's position and a city-only customer resolve
  // to the same coordinate. Give the camera a small, real area instead of
  // letting it jump to an extreme zoom level or fail to move on Android.
  const minimumSpan = 0.002;
  if (east - west < minimumSpan) {
    const adjustment = (minimumSpan - (east - west)) / 2;
    west -= adjustment;
    east += adjustment;
  }
  if (north - south < minimumSpan) {
    const adjustment = (minimumSpan - (north - south)) / 2;
    south -= adjustment;
    north += adjustment;
  }

  return [west, south, east, north];
}
