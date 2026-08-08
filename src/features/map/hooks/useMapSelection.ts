import { useCallback, useState } from "react";

import { mapSelectionService } from "@/src/features/map/services/mapSelectionService";
import { distanceKm } from "@/src/features/map/utils/circleMath";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { MapCircleSelection, MapSelectionPoint, MapSelectionTool } from "@/src/features/map/types/mapSelectionTypes";

export function useMapSelection(markers: MapCustomerMarker[]) {
  const [activeTool, setActiveTool] = useState<MapSelectionTool>("none");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [circleDraftCenter, setCircleDraftCenter] = useState<MapSelectionPoint | null>(null);
  const [circleConfirmed, setCircleConfirmed] = useState<MapCircleSelection | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<MapSelectionPoint[]>([]);
  const [polygonConfirmed, setPolygonConfirmed] = useState<MapSelectionPoint[] | null>(null);

  const selectTool = useCallback((tool: MapSelectionTool) => {
    setActiveTool((current) => (current === tool ? "none" : tool));
    setCircleDraftCenter(null);
    setPolygonPoints([]);
  }, []);

  const toggleSelection = useCallback((markerId: string) => {
    setSelectedIds((current) => mapSelectionService.toggleMarkerSelection(current, markerId));
  }, []);

  const handleMarkerPress = useCallback(
    (marker: MapCustomerMarker) => {
      if (activeTool === "single") {
        toggleSelection(marker.id);
      }
    },
    [activeTool, toggleSelection],
  );

  const handleMapPress = useCallback(
    (point: MapSelectionPoint) => {
      if (activeTool === "circle") {
        if (!circleDraftCenter) {
          setCircleDraftCenter(point);
          return;
        }

        const circle: MapCircleSelection = { ...circleDraftCenter, radiusKm: distanceKm(circleDraftCenter, point) };
        setCircleConfirmed(circle);
        setCircleDraftCenter(null);
        setSelectedIds((current) =>
          mapSelectionService.mergeSelection(current, mapSelectionService.getMarkerIdsInCircle(markers, circle)),
        );
        return;
      }

      if (activeTool === "polygon") {
        setPolygonPoints((current) => [...current, point]);
      }
    },
    [activeTool, circleDraftCenter, markers],
  );

  const closePolygon = useCallback(() => {
    if (polygonPoints.length < 3) {
      return;
    }

    setPolygonConfirmed(polygonPoints);
    setSelectedIds((current) =>
      mapSelectionService.mergeSelection(current, mapSelectionService.getMarkerIdsInPolygon(markers, polygonPoints)),
    );
    setPolygonPoints([]);
  }, [markers, polygonPoints]);

  const undoPolygonPoint = useCallback(() => {
    setPolygonPoints((current) => current.slice(0, -1));
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedIds(mapSelectionService.resetSelection());
    setCircleDraftCenter(null);
    setCircleConfirmed(null);
    setPolygonPoints([]);
    setPolygonConfirmed(null);
  }, []);

  return {
    activeTool,
    selectedIds,
    selectedCount: selectedIds.length,
    circleDraftCenter,
    circleConfirmed,
    polygonPoints,
    polygonConfirmed,
    selectTool,
    toggleSelection,
    handleMarkerPress,
    handleMapPress,
    closePolygon,
    undoPolygonPoint,
    resetSelection,
  };
}
