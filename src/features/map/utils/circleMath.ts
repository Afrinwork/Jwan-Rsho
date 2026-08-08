import { MapCircleSelection, MapSelectionPoint } from "@/src/features/map/types/mapSelectionTypes";

const earthRadiusKm = 6371;

export function distanceKm(from: MapSelectionPoint, to: MapSelectionPoint) {
  const latDistance = toRadians(to.latitude - from.latitude);
  const lngDistance = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(lngDistance / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isPointInsideCircle(point: MapSelectionPoint, circle: MapCircleSelection) {
  return distanceKm(point, circle) <= circle.radiusKm;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
