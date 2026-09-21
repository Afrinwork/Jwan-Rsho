import { distanceKm, isPointInsideCircle } from "@/src/features/map/utils/circleMath";
import { isPointInsidePolygon } from "@/src/features/map/utils/polygonMath";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { MapCircleSelection, MapSelectionPoint } from "@/src/features/map/types/mapSelectionTypes";

export type PolygonAppendResult = {
  points: MapSelectionPoint[];
  editEnd: "start" | "end";
};

export const mapSelectionService = {
  toggleMarkerSelection(selectedIds: string[], markerId: string) {
    return selectedIds.includes(markerId)
      ? selectedIds.filter((value) => value !== markerId)
      : [...selectedIds, markerId];
  },

  resetSelection() {
    return [] as string[];
  },

  mergeSelection(selectedIds: string[], newIds: string[]) {
    return [...new Set([...selectedIds, ...newIds])];
  },

  getMarkerIdsInCircle(markers: MapCustomerMarker[], circle: MapCircleSelection) {
    return markers.filter((marker) => isPointInsideCircle(marker, circle)).map((marker) => marker.id);
  },

  getMarkerIdsInPolygon(markers: MapCustomerMarker[], polygon: MapSelectionPoint[]) {
    return markers.filter((marker) => isPointInsidePolygon(marker, polygon)).map((marker) => marker.id);
  },

  shouldAppendPolygonPoint(points: MapSelectionPoint[], point: MapSelectionPoint, minDistanceKm = 0.015) {
    const lastPoint = points.at(-1);
    if (!lastPoint) return true;

    const firstPoint = points[0];
    return distanceKm(lastPoint, point) >= minDistanceKm && distanceKm(firstPoint, point) >= minDistanceKm;
  },

  appendPolygonPoint(points: MapSelectionPoint[], point: MapSelectionPoint): PolygonAppendResult {
    if (points.length === 0) {
      return { points: [point], editEnd: "end" };
    }

    const firstPoint = points[0];
    const lastPoint = points.at(-1) as MapSelectionPoint;
    const editEnd = distanceKm(point, firstPoint) < distanceKm(point, lastPoint) ? "start" : "end";

    return {
      editEnd,
      points: editEnd === "start" ? [point, ...points] : [...points, point],
    };
  },

  undoPolygonPoint(points: MapSelectionPoint[], editEnd: "start" | "end") {
    return editEnd === "start" ? points.slice(1) : points.slice(0, -1);
  },
};
