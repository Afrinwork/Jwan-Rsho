import { useCallback, useEffect, useRef, useState } from "react";

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
  const [polygonBaseSelectedIds, setPolygonBaseSelectedIds] = useState<string[]>([]);
  const [polygonPaused, setPolygonPaused] = useState(false);
  const polygonPausedRef = useRef(false);
  const activeToolRef = useRef<MapSelectionTool>("none");
  const polygonPointsRef = useRef<MapSelectionPoint[]>([]);
  const polygonBaseSelectedIdsRef = useRef<string[]>([]);
  const polygonEditEndRef = useRef<"start" | "end">("end");
  const frameRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPolygonPointsRef = useRef<MapSelectionPoint[] | null>(null);
  const DRAG_THROTTLE_MS = 50;

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    polygonPointsRef.current = polygonPoints;
  }, [polygonPoints]);

  useEffect(() => {
    polygonBaseSelectedIdsRef.current = polygonBaseSelectedIds;
  }, [polygonBaseSelectedIds]);

  useEffect(() => {
    polygonPausedRef.current = polygonPaused;
  }, [polygonPaused]);

  useEffect(() => () => {
    if (frameRef.current !== null) {
      clearTimeout(frameRef.current);
    }
  }, []);

  const applyPolygonPoints = useCallback((points: MapSelectionPoint[], baseSelectedIds: string[]) => {
    polygonPointsRef.current = points;
    setPolygonPoints(points);
    setSelectedIds(buildPolygonSelection(points, baseSelectedIds, markers));
  }, [markers]);

  const commitPendingPolygonPoints = useCallback((baseSelectedIds: string[]) => {
    if (frameRef.current !== null) {
      clearTimeout(frameRef.current);
      frameRef.current = null;
    }

    const pendingPoints = pendingPolygonPointsRef.current;
    if (!pendingPoints) {
      return;
    }

    pendingPolygonPointsRef.current = null;
    applyPolygonPoints(pendingPoints, baseSelectedIds);
  }, [applyPolygonPoints]);

  const selectTool = useCallback((tool: MapSelectionTool) => {
    const nextTool = activeToolRef.current === tool ? "none" : tool;

    if (frameRef.current !== null) {
      clearTimeout(frameRef.current);
      frameRef.current = null;
    }

    pendingPolygonPointsRef.current = null;
    setActiveTool(nextTool);
    activeToolRef.current = nextTool;

    if (nextTool === "polygon") {
      setPolygonBaseSelectedIds(selectedIds);
      polygonBaseSelectedIdsRef.current = selectedIds;
    } else {
      setPolygonBaseSelectedIds([]);
      polygonBaseSelectedIdsRef.current = [];
    }

    setCircleDraftCenter(null);
    setCircleConfirmed(null);
    setPolygonPoints([]);
    polygonPointsRef.current = [];
    polygonEditEndRef.current = "end";
    setPolygonConfirmed(null);
    setPolygonPaused(false);
    polygonPausedRef.current = false;
  }, [selectedIds]);

  const togglePolygonPause = useCallback(() => {
    setPolygonPaused((current) => {
      const next = !current;
      polygonPausedRef.current = next;
      return next;
    });
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
    },
    [activeTool, circleDraftCenter, markers],
  );

  const handleMapDrag = useCallback(
    (point: MapSelectionPoint) => {
      if (activeToolRef.current !== "polygon" || polygonPausedRef.current) {
        return;
      }

      const currentPoints = pendingPolygonPointsRef.current ?? polygonPointsRef.current;

      if (!mapSelectionService.shouldAppendPolygonPoint(currentPoints, point)) {
        return;
      }

      const appendResult = mapSelectionService.appendPolygonPoint(currentPoints, point);
      pendingPolygonPointsRef.current = appendResult.points;
      polygonEditEndRef.current = appendResult.editEnd;

      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = setTimeout(() => {
        frameRef.current = null;
        const latestPoints = pendingPolygonPointsRef.current;

        if (!latestPoints) {
          return;
        }

        pendingPolygonPointsRef.current = null;
        applyPolygonPoints(latestPoints, polygonBaseSelectedIdsRef.current);
      }, DRAG_THROTTLE_MS);
    },
    [applyPolygonPoints],
  );

  const closePolygon = useCallback(() => {
    commitPendingPolygonPoints(polygonBaseSelectedIdsRef.current);
    const currentPoints = polygonPointsRef.current;

    if (currentPoints.length < 3) {
      return;
    }

    if (frameRef.current !== null) {
      clearTimeout(frameRef.current);
      frameRef.current = null;
    }

    const nextSelection = buildPolygonSelection(currentPoints, polygonBaseSelectedIdsRef.current, markers);
    setPolygonConfirmed(currentPoints);
    setSelectedIds(nextSelection);
    setPolygonBaseSelectedIds(nextSelection);
    polygonBaseSelectedIdsRef.current = nextSelection;
    setPolygonPoints([]);
    polygonPointsRef.current = [];
    polygonEditEndRef.current = "end";
    pendingPolygonPointsRef.current = null;
    setActiveTool("none");
    activeToolRef.current = "none";
  }, [commitPendingPolygonPoints, markers]);

  const undoPolygonPoint = useCallback(() => {
    commitPendingPolygonPoints(polygonBaseSelectedIdsRef.current);
    const nextPoints = mapSelectionService.undoPolygonPoint(polygonPointsRef.current, polygonEditEndRef.current);
    applyPolygonPoints(nextPoints, polygonBaseSelectedIdsRef.current);
    pendingPolygonPointsRef.current = nextPoints;
  }, [applyPolygonPoints, commitPendingPolygonPoints]);

  const resetSelection = useCallback(() => {
    if (frameRef.current !== null) {
      clearTimeout(frameRef.current);
      frameRef.current = null;
    }

    setSelectedIds(mapSelectionService.resetSelection());
    setCircleDraftCenter(null);
    setCircleConfirmed(null);
    setPolygonPoints([]);
    polygonPointsRef.current = [];
    polygonEditEndRef.current = "end";
    setPolygonConfirmed(null);
    setPolygonBaseSelectedIds([]);
    polygonBaseSelectedIdsRef.current = [];
    pendingPolygonPointsRef.current = null;
    setPolygonPaused(false);
    polygonPausedRef.current = false;
  }, []);

  return {
    activeTool,
    selectedIds,
    selectedCount: selectedIds.length,
    circleDraftCenter,
    circleConfirmed,
    polygonPoints,
    polygonConfirmed,
    polygonPaused,
    selectTool,
    toggleSelection,
    handleMarkerPress,
    handleMapPress,
    handleMapDrag,
    closePolygon,
    undoPolygonPoint,
    togglePolygonPause,
    resetSelection,
  };
}

function buildPolygonSelection(
  points: MapSelectionPoint[],
  baseSelectedIds: string[],
  markers: MapCustomerMarker[],
) {
  if (points.length < 3) {
    return baseSelectedIds;
  }

  return mapSelectionService.mergeSelection(
    baseSelectedIds,
    mapSelectionService.getMarkerIdsInPolygon(markers, points),
  );
}
