import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { isDriver } from "@/src/features/auth/permissions";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { useLiveLocation } from "@/src/features/route/hooks/useLiveLocation";
import { useMovementAnchor } from "@/src/features/route/hooks/useMovementAnchor";
import { useRouteLiveNavigation } from "@/src/features/route/hooks/useRouteLiveNavigation";
import { useRouteOrder } from "@/src/features/route/hooks/useRouteOrder";
import { useRoutePolyline } from "@/src/features/route/hooks/useRoutePolyline";
import { activeTripStorage } from "@/src/features/route/services/activeTripStorage";
import { TripStartLocation } from "@/src/features/route/services/activeTripStorage.shared";
import { buildCumulativeStops, buildFallbackLegs, STOP_SERVICE_BUFFER_SEC } from "@/src/features/route/services/routeDirectionsService";
import { fetchRoadDistanceMatrix, RouteDistanceMatrix } from "@/src/features/route/services/routeDistanceMatrixService";
import { insertMarkersAfterAnchor } from "@/src/features/route/services/routeLiveReorderService";
import { moveIdToPosition, reorderKnownInPlace } from "@/src/features/route/services/routeManualOrderService";
import { presetRouteOrder } from "@/src/features/route/services/routeSortModeService";
import { alternativeRouteOrder, optimizedRemainingOrder } from "@/src/features/route/services/routeVariantService";
import { RouteOrigin } from "@/src/features/route/types/routeTypes";
import { parseTimeInput } from "@/src/features/route/utils/routeFormat";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";

// Remaining km/duration/ETA are recalculated from the live position only
// after this much movement (one Directions request per recalculation).
const LIVE_ORIGIN_MIN_METERS = 500;
// The road-following line and its timings cover the next stops only: one
// Directions request (Google's waypoint limit) instead of one per 23 stops
// on every recalculation. Arrival times further out are estimated, and no
// line is drawn past these stops (never a straight line between customers).
const ROAD_ROUTE_STOP_LIMIT = 23;
// "New route" tries this many variants for one that differs from the
// current order — only runs out with a single possible order.
const MAX_NEW_ROUTE_ATTEMPTS = 12;

type LatLng = { latitude: number; longitude: number };
export type TripResortKind = "optimize" | "variant" | "nearest" | "farthest" | "city";

// The trip that is always running on the map (like IBI): every customer on
// the map is a numbered stop, there is no "start" step. Customers that show
// up later (new order, new assignment) are slotted in where they add the
// least detour — after the stop being driven to right now — and completed
// ones drop out. Completed/skipped stops and the order survive the app being
// closed (activeTripStorage, same day only).
//
// "Start trip" on a drawn selection narrows the trip to those customers
// (scope); the others stay on the map, just not on the route.
//
// The numbered stops are there from the start, but the route line only once
// the trip is started — until then the driver can still pick the start point
// and the departure time the planned arrival times are based on.
export function useMapTrip(mapMarkers: MapCustomerMarker[], ready: boolean, fallbackOrigin: LatLng | null) {
  const currentUser = useCurrentUser();
  const userId = currentUser?.uid ?? null;
  const isCurrentUserDriver = isDriver(currentUser);
  // The person's own saved list — kept in sync with re-sorts, and an admin
  // re-sorting this driver's list mid-drive reaches the trip through it.
  const routeOrder = useRouteOrder(userId);
  const live = useLiveLocation();
  // null = every customer on the map is on the route.
  const [scopeIds, setScopeIds] = useState<string[] | null>(null);
  const stopMarkers = useMemo(() => {
    if (!scopeIds) return mapMarkers;
    const scope = new Set(scopeIds);
    return mapMarkers.filter((marker) => scope.has(marker.id));
  }, [mapMarkers, scopeIds]);
  const markerById = useMemo(() => new Map(stopMarkers.map((marker) => [marker.id, marker])), [stopMarkers]);

  // null until the first order is decided (stored trip or a fresh sort).
  const [orderIds, setOrderIds] = useState<string[] | null>(null);
  const [lastStopId, setLastStopId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  // null = start from the GPS position.
  const [startLocation, setStartLocation] = useState<TripStartLocation | null>(null);
  // "HH:MM" German time, null = leave now.
  const [departureTime, setDepartureTime] = useState<string | null>(null);
  const orderedMarkers = useMemo(
    () => (orderIds ?? []).map((id) => markerById.get(id)).filter((marker) => marker !== undefined),
    [orderIds, markerById],
  );
  const navigation = useRouteLiveNavigation(orderedMarkers, live.coordinate);
  const restoreNavigation = navigation.restore;
  const currentStopId = navigation.currentMarker?.id ?? null;
  const currentStopIdRef = useRef<string | null>(null);
  const lastStopIdRef = useRef<string | null>(null);
  const mapMarkersRef = useRef(mapMarkers);
  const startOrigin = live.coordinate ?? fallbackOrigin;
  const startOriginRef = useRef(startOrigin);
  useEffect(() => {
    currentStopIdRef.current = currentStopId;
    lastStopIdRef.current = lastStopId;
    mapMarkersRef.current = mapMarkers;
    startOriginRef.current = startOrigin;
  });

  // First order: today's stored trip (with its completed/skipped stops), or
  // nearest-first from where the driver is. Runs once, when the customers
  // have loaded.
  const initStartedRef = useRef(false);
  useEffect(() => {
    if (!ready || !userId || initStartedRef.current) return;
    initStartedRef.current = true;

    void activeTripStorage.load(userId).then((stored) => {
      const scope = stored?.scopeIds ? new Set(stored.scopeIds) : null;
      const markers = scope ? mapMarkersRef.current.filter((marker) => scope.has(marker.id)) : mapMarkersRef.current;
      if (stored?.scopeIds) setScopeIds(stored.scopeIds);
      const byId = new Map(markers.map((marker) => [marker.id, marker]));
      if (stored) {
        setStarted(Boolean(stored.started));
        if (stored.started) setStartedAt(new Date());
        setStartLocation(stored.startLocation ?? null);
        setDepartureTime(stored.departureTime ?? null);
        const kept = stored.orderedIds.map((id) => byId.get(id)).filter((marker) => marker !== undefined);
        const keptIds = new Set(kept.map((marker) => marker.id));
        const fresh = markers.filter((marker) => !keptIds.has(marker.id));
        const pending = kept.find((marker) => !stored.handledIds.includes(marker.id));
        restoreNavigation({ handledIds: stored.handledIds, skippedIds: stored.skippedIds });
        setOrderIds(insertMarkersAfterAnchor(kept, fresh, pending?.id ?? null).map((marker) => marker.id));
        return;
      }
      setOrderIds(nearestFirst(markers, startOriginRef.current));
    });
  }, [ready, userId, restoreNavigation]);

  // The customers on the map changed (new order or assignment, completed,
  // filter): keep the order of the known ones, slot new ones in after the
  // current stop, drop the ones that are gone.
  useEffect(() => {
    if (orderIds === null) return;
    const present = new Set(stopMarkers.map((marker) => marker.id));
    const known = new Set(orderIds);
    const kept = orderIds.filter((id) => present.has(id));
    const fresh = stopMarkers.filter((marker) => !known.has(marker.id));
    if (kept.length === orderIds.length && !fresh.length) return;

    const keptMarkers = kept.map((id) => markerById.get(id)).filter((marker) => marker !== undefined);
    const next = insertMarkersAfterAnchor(keptMarkers, fresh, currentStopIdRef.current).map((marker) => marker.id);
    setOrderIds(pinLast(next, lastStopIdRef.current));
    // Only a change of the customer set re-runs this, not a re-sort.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopMarkers]);

  // Starting a trip for a selection (or going back to every customer):
  // a fresh trip — nearest first from where the driver is, nothing done or
  // skipped yet, no pinned last stop.
  // A selection trip starts right away ("Start trip" on the selection);
  // going back to every customer is a plan again until started.
  function changeScope(nextScopeIds: string[] | null) {
    const scope = nextScopeIds ? new Set(nextScopeIds) : null;
    const markers = scope ? mapMarkers.filter((marker) => scope.has(marker.id)) : mapMarkers;
    setScopeIds(nextScopeIds);
    setLastStopId(null);
    lastStopIdRef.current = null;
    variantIndexRef.current = 0;
    restoreNavigation({ handledIds: [], skippedIds: [] });
    setOrderIds(nearestFirst(markers, startLocation ?? live.coordinate ?? startOrigin));
    setStarted(nextScopeIds !== null);
    setStartedAt(nextScopeIds !== null ? new Date() : null);
  }

  function startTrip() {
    setStarted(true);
    setStartedAt(new Date());
  }

  function endTrip() {
    setStarted(false);
    setStartedAt(null);
  }

  // Skipping keeps the customer open: it moves to the end of the route
  // (before a pinned last stop) and is marked on the map.
  function skipStop(customerId: string | null = currentStopId) {
    if (!customerId) return;
    navigation.markSkipped(customerId);
    const pendingIds = navigation.pendingMarkers.map((marker) => marker.id);
    if (pendingIds.length > 1 && pendingIds.includes(customerId)) {
      applyPendingOrder([...pendingIds.filter((id) => id !== customerId), customerId]);
    }
  }

  // A new start point re-sorts the stops nearest-first from there (before
  // the trip is started; mid-drive the order is left alone).
  function chooseStartLocation(location: TripStartLocation | null) {
    setStartLocation(location);
    if (!started) resort("nearest", location ?? live.coordinate ?? fallbackOrigin);
  }

  // New order of the remaining stops; done/skipped ones stay in front.
  const reorderPending = useCallback((pendingIds: string[]) => {
    const pinned = pinLast(pendingIds, lastStopIdRef.current);
    const moved = new Set(pinned);
    setOrderIds((current) => [...(current ?? []).filter((id) => !moved.has(id)), ...pinned]);
    return pinned;
  }, []);

  const saveOwnOrder = routeOrder.save;
  const applyPendingOrder = useCallback(
    (pendingIds: string[]) => {
      const applied = reorderPending(pendingIds);
      void saveOwnOrder(applied);
    },
    [reorderPending, saveOwnOrder],
  );

  function movePendingStop(customerId: string, pendingPosition: number) {
    const pendingIds = navigation.pendingMarkers.map((marker) => marker.id);
    const nextIds = moveIdToPosition(pendingIds, customerId, pendingPosition);
    if (nextIds !== pendingIds) applyPendingOrder(nextIds);
  }

  function chooseLastStop(customerId: string | null) {
    setLastStopId(customerId);
    lastStopIdRef.current = customerId;
    applyPendingOrder(navigation.pendingMarkers.map((marker) => marker.id));
  }

  // A re-sort saved from elsewhere mid-drive (the admin editing this driver's
  // list) reaches the trip; the order stored when the map opened is only the
  // baseline. Own re-sorts come back here too but change nothing.
  const baselineSavedIdsRef = useRef<string[] | null | undefined>(undefined);
  useEffect(() => {
    if (!routeOrder.loaded || orderIds === null) return;
    if (baselineSavedIdsRef.current === undefined) {
      baselineSavedIdsRef.current = routeOrder.savedIds;
      return;
    }
    if (!routeOrder.savedIds) return;
    const pendingIds = navigation.pendingMarkers.map((marker) => marker.id);
    const nextIds = reorderKnownInPlace(pendingIds, routeOrder.savedIds);
    if (nextIds !== pendingIds) reorderPending(nextIds);
    // Only a change of the saved order re-sorts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeOrder.loaded, routeOrder.savedIds]);

  // Kept on the device so the trip survives the app being closed.
  const orderKey = orderedMarkers.map((marker) => marker.id).join(",");
  useEffect(() => {
    if (!userId || !orderKey) return;
    void activeTripStorage.save({
      userId,
      orderedIds: orderKey.split(","),
      handledIds: [...navigation.handledIds],
      skippedIds: [...navigation.skippedIds],
      scopeIds,
      started,
      startLocation,
      departureTime,
    });
  }, [userId, orderKey, navigation.handledIds, navigation.skippedIds, scopeIds, started, startLocation, departureTime]);

  // Mirrors the driver's trip for their admin (driver map): remaining stops
  // in driving order and the next one.
  const saveTrip = routeOrder.saveTrip;
  const pendingKey = navigation.pendingMarkers.map((marker) => marker.id).join(",");
  useEffect(() => {
    if (!isCurrentUserDriver || orderIds === null) return;
    void saveTrip({ customerIds: pendingKey ? pendingKey.split(",") : [], currentCustomerId: currentStopId });
  }, [isCurrentUserDriver, orderIds, pendingKey, currentStopId, saveTrip]);

  // Remaining km/duration/ETA from where the driver actually is, refreshed
  // every LIVE_ORIGIN_MIN_METERS of movement. Before the trip is started, a
  // chosen start point and departure time replace GPS position and "now".
  const liveAnchor = useMovementAnchor(live.coordinate, LIVE_ORIGIN_MIN_METERS);
  const planningFromChosenStart = !started && startLocation !== null;
  const remainingRouteOrigin = planningFromChosenStart
    ? navigation.legOrigin ?? startLocation
    : liveAnchor?.coordinate ?? navigation.legOrigin ?? startOrigin;
  const [openedAt] = useState(() => new Date());
  const plannedDeparture = useMemo(() => (departureTime ? parseTimeInput(departureTime) : null), [departureTime]);
  const etaAnchor = started ? liveAnchor?.at ?? startedAt ?? openedAt : plannedDeparture ?? liveAnchor?.at ?? openedAt;
  const nearStops = useMemo(() => navigation.pendingMarkers.slice(0, ROAD_ROUTE_STOP_LIMIT), [navigation.pendingMarkers]);
  const farStops = useMemo(() => navigation.pendingMarkers.slice(ROAD_ROUTE_STOP_LIMIT), [navigation.pendingMarkers]);
  const polyline = useRoutePolyline(remainingRouteOrigin, nearStops, etaAnchor);

  // The line follows the roads and is only shown once the trip is started.
  // Stops past the road-routed ones get no line, only an estimated arrival
  // continuing from the last road-routed stop.
  const lineCoordinates = started ? polyline.coordinates : [];
  const etaById = useMemo(() => {
    const lastNear = nearStops.at(-1);
    const lastEta = lastNear ? polyline.etaById.get(lastNear.id) : undefined;
    if (!farStops.length || !lastNear || !lastEta) return polyline.etaById;
    const start = new Date(lastEta.getTime() + STOP_SERVICE_BUFFER_SEC * 1000);
    const far = buildCumulativeStops(buildFallbackLegs({ ...lastNear, label: "" }, farStops), start);
    return new Map([...polyline.etaById, ...far.map((stop) => [stop.id, stop.cumulativeEta] as const)]);
  }, [polyline.etaById, nearStops, farStops]);

  // Re-sorting the remaining stops from the current position (real driving
  // distances when available).
  const [resorting, setResorting] = useState<TripResortKind | null>(null);
  const variantIndexRef = useRef(0);
  const pendingIdsRef = useRef<string[]>([]);
  useEffect(() => {
    pendingIdsRef.current = navigation.pendingMarkers.map((marker) => marker.id);
  });

  async function resort(kind: TripResortKind, fromOverride?: LatLng | null) {
    const from = fromOverride ?? (planningFromChosenStart ? startLocation : live.coordinate) ?? remainingRouteOrigin;
    const points = navigation.pendingMarkers;
    if (!from || points.length < 2) return;

    setResorting(kind);
    try {
      const origin = { latitude: from.latitude, longitude: from.longitude, label: "" };
      const roadMatrix = await fetchRoadDistanceMatrix(origin, points);
      const orderedIds = orderFor(kind, origin, points, roadMatrix);
      // A stop may have been completed/added while the distances loaded.
      const pendingNow = pendingIdsRef.current;
      const stillPending = new Set(pendingNow);
      const nextIds = [...orderedIds.filter((id) => stillPending.has(id)), ...pendingNow.filter((id) => !orderedIds.includes(id))];
      if (nextIds.some((id, index) => id !== pendingNow[index])) applyPendingOrder(nextIds);
    } finally {
      setResorting(null);
    }
  }

  function orderFor(kind: TripResortKind, origin: RouteOrigin, points: MapCustomerMarker[], roadMatrix: RouteDistanceMatrix | null) {
    if (kind === "optimize") return optimizedRemainingOrder(origin, points, roadMatrix).map((marker) => marker.id);
    if (kind !== "variant") return (presetRouteOrder(kind, origin, points, 0, roadMatrix) ?? points).map((marker) => marker.id);
    // Each tap moves on to the next variant that differs from the current
    // order (with two stops that simply alternates).
    const current = points.map((marker) => marker.id).join(",");
    for (let attempt = 0; attempt < MAX_NEW_ROUTE_ATTEMPTS; attempt += 1) {
      const ids = alternativeRouteOrder(origin, points, variantIndexRef.current, roadMatrix).map((marker) => marker.id);
      variantIndexRef.current += 1;
      if (ids.join(",") !== current) return ids;
    }
    return points.map((marker) => marker.id);
  }

  return {
    ready: orderIds !== null,
    orderedMarkers,
    navigation,
    live,
    polyline,
    lineCoordinates,
    etaById,
    remainingRouteOrigin,
    lastStopId,
    resorting,
    started,
    startLocation,
    departureTime,
    startTrip,
    endTrip,
    skipStop,
    chooseStartLocation,
    chooseDepartureTime: setDepartureTime,
    // Number of customers the trip is narrowed to, null = all on the map.
    scopeCount: scopeIds ? stopMarkers.length : null,
    startForSelection: (customerIds: string[]) => changeScope(customerIds),
    showAllCustomers: () => changeScope(null),
    movePendingStop,
    chooseLastStop,
    resort: (kind: TripResortKind) => void resort(kind),
  };
}

function nearestFirst(markers: MapCustomerMarker[], from: LatLng | null) {
  const origin = from ?? markers[0];
  const sorted = origin ? presetRouteOrder("nearest", { ...origin, label: "" }, markers) ?? markers : markers;
  return sorted.map((marker) => marker.id);
}

function pinLast(ids: string[], lastStopId: string | null) {
  if (!lastStopId || !ids.includes(lastStopId) || ids.at(-1) === lastStopId) return ids;
  return [...ids.filter((id) => id !== lastStopId), lastStopId];
}
