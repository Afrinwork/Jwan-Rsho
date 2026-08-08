import { isPointInsideCircle } from "@/src/features/map/utils/circleMath";
import { isPointInsidePolygon } from "@/src/features/map/utils/polygonMath";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { MapCircleSelection, MapSelectionPoint } from "@/src/features/map/types/mapSelectionTypes";

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
};
