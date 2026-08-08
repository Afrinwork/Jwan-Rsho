import { MapSelectionPoint } from "@/src/features/map/types/mapSelectionTypes";

export function isPointInsidePolygon(point: MapSelectionPoint, polygon: MapSelectionPoint[]) {
  if (polygon.length < 3) {
    return false;
  }

  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const vertexA = polygon[i];
    const vertexB = polygon[j];
    const crossesLatitude = vertexA.latitude > point.latitude !== vertexB.latitude > point.latitude;

    if (!crossesLatitude) {
      continue;
    }

    const intersectionLongitude =
      ((vertexB.longitude - vertexA.longitude) * (point.latitude - vertexA.latitude)) /
        (vertexB.latitude - vertexA.latitude) +
      vertexA.longitude;

    if (point.longitude < intersectionLongitude) {
      inside = !inside;
    }
  }

  return inside;
}
