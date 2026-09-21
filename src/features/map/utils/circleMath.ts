import { MapCircleSelection, MapSelectionPoint } from "@/src/features/map/types/mapSelectionTypes";

const earthRadiusKm = 6371;

export function distanceKm(from: MapSelectionPoint, to: MapSelectionPoint) {
  const latDistance = toRadians(to.latitude - from.latitude);
  const lngDistance = toRadians(to.longitude - from.longitude);
  const rawA =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(lngDistance / 2) ** 2;
  // Floating-point rounding can push this a hair outside [0, 1] (e.g. for
  // two points at/near the exact same coordinates) -- unclamped, Math.sqrt
  // of a slightly negative `1 - a` returns NaN, which would then silently
  // poison every downstream ETA/distance calculation for the whole route.
  const a = Math.min(1, Math.max(0, rawA));

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isPointInsideCircle(point: MapSelectionPoint, circle: MapCircleSelection) {
  return distanceKm(point, circle) <= circle.radiusKm;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
