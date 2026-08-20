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

      pendingPolygonPointsRef.current = [...currentPoints, point];

      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = setTimeout(() => {
        frameRef.current = null;
        const latestPoints = pendingPolygonPointsRef.current;

        if (!latestPoints) {
          return;
        }

        polygonPointsRef.current = latestPoints;
        setPolygonPoints(latestPoints);
        setSelectedIds(buildPolygonSelection(latestPoints, polygonBaseSelectedIdsRef.current, markers));
      }, DRAG_THROTTLE_MS);
    },
    [markers],
  );

  const closePolygon = useCallback(() => {
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
    pendingPolygonPointsRef.current = null;
    setActiveTool("none");
    activeToolRef.current = "none";
  }, [markers]);

  const undoPolygonPoint = useCallback(() => {
    const nextPoints = polygonPointsRef.current.slice(0, -1);
    polygonPointsRef.current = nextPoints;
    pendingPolygonPointsRef.current = nextPoints;
    setPolygonPoints(nextPoints);
    setSelectedIds(buildPolygonSelection(nextPoints, polygonBaseSelectedIdsRef.current, markers));
  }, [markers]);

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
