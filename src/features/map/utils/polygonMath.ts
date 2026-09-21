import { MapSelectionPoint } from "@/src/features/map/types/mapSelectionTypes";

export function isPointInsidePolygon(point: MapSelectionPoint, polygon: MapSelectionPoint[]) {
  if (polygon.length < 3) {
    return false;
  }

  if (polygon.some((vertex, index) => isPointOnSegment(point, vertex, polygon[(index + 1) % polygon.length]))) {
    return true;
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

function isPointOnSegment(point: MapSelectionPoint, start: MapSelectionPoint, end: MapSelectionPoint) {
  const cross =
    (point.longitude - start.longitude) * (end.latitude - start.latitude) -
    (point.latitude - start.latitude) * (end.longitude - start.longitude);

  if (Math.abs(cross) > 1e-10) {
    return false;
  }

  return (
    point.longitude >= Math.min(start.longitude, end.longitude) - 1e-10 &&
    point.longitude <= Math.max(start.longitude, end.longitude) + 1e-10 &&
    point.latitude >= Math.min(start.latitude, end.latitude) - 1e-10 &&
    point.latitude <= Math.max(start.latitude, end.latitude) + 1e-10
  );
}
