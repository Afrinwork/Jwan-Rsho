import { useCallback, useMemo, useState } from "react";

import { distanceKm } from "@/src/features/map/utils/circleMath";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { formatError } from "@/src/utils/formatError";

const ARRIVAL_THRESHOLD_KM = 0.12;

export function useRouteLiveNavigation(
  markers: MapCustomerMarker[],
  liveCoordinate: { latitude: number; longitude: number } | null,
  // Restored from a trip resumed after the app was closed (activeTripStorage).
  initialState?: { handledIds: string[]; skippedIds: string[] },
) {
  const [handledIds, setHandledIds] = useState<Set<string>>(() => new Set(initialState?.handledIds));
  // Skipped stops — NOT in handledIds: a skipped customer stays open and on
  // the route, only marked on the map (see RouteStopMarker/
  // routeStopMarkerStyleService) so the driver knows it still needs a visit.
  const [skippedIds, setSkippedIds] = useState<Set<string>>(() => new Set(initialState?.skippedIds));
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [completingArrival, setCompletingArrival] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // Coordinates of the most recently completed/skipped stop — once set, the
  // remaining route is recalculated from here instead of the original start
  // location, so "distance/route to next address" always starts fresh from
  // wherever the driver just finished.
  const [legOrigin, setLegOrigin] = useState<{ latitude: number; longitude: number } | null>(null);

  const pendingMarkers = useMemo(() => markers.filter((marker) => !handledIds.has(marker.id)), [markers, handledIds]);
  // The stops actually driven to: a skipped stop keeps its place and number
  // but the route line goes past it (2 → 4 with 3 skipped), and it is never
  // the current stop, until it is reactivated.
  const routeMarkers = useMemo(() => pendingMarkers.filter((marker) => !skippedIds.has(marker.id)), [pendingMarkers, skippedIds]);
  const currentMarker = routeMarkers[0] ?? null;
  const allDone = markers.length > 0 && pendingMarkers.length === 0;

  const distanceToCurrentKm = useMemo(() => {
    if (!currentMarker || !liveCoordinate) return null;
    return distanceKm(liveCoordinate, currentMarker);
  }, [currentMarker, liveCoordinate]);

  const arrivalPromptVisible =
    currentMarker !== null &&
    distanceToCurrentKm !== null &&
    distanceToCurrentKm <= ARRIVAL_THRESHOLD_KM &&
    !dismissedIds.has(currentMarker.id);

  // Returns whether the order actually got completed — callers that need to
  // react to a successful arrival (e.g. closing a panel or advancing some
  // reducer's own stop index) can't just assume success, since this can fail.
  const confirmArrival = useCallback(async (): Promise<boolean> => {
    if (!currentMarker) return false;

    setActionError(null);
    setCompletingArrival(true);

    try {
      const orders = await orderDetailsRepository.getOpenOrdersWithItemsByCustomerIds([currentMarker.id]);
      await Promise.all(orders.map((order) => orderRepository.completeOrder(order.id)));
      setHandledIds((current) => new Set(current).add(currentMarker.id));
      setSkippedIds((current) => {
        if (!current.has(currentMarker.id)) return current;
        const next = new Set(current);
        next.delete(currentMarker.id);
        return next;
      });
      setLegOrigin({ latitude: currentMarker.latitude, longitude: currentMarker.longitude });
      return true;
    } catch (error) {
      setActionError(formatError(error).message);
      return false;
    } finally {
      setCompletingArrival(false);
    }
  }, [currentMarker]);

  const dismissArrival = useCallback(() => {
    if (!currentMarker) return;
    setDismissedIds((current) => new Set(current).add(currentMarker.id));
  }, [currentMarker]);

  // A skipped customer stays OPEN: still pending, just marked (orange) so the
  // driver sees it still needs a visit, and left out of routeMarkers so the
  // route goes straight on to the next stop. Deliberately does NOT touch
  // legOrigin, unlike confirmArrival above — a skipped stop was never
  // visited, so the route keeps departing from where it already was.
  const markSkipped = useCallback((customerId: string) => {
    setSkippedIds((current) => new Set(current).add(customerId));
    setDismissedIds((current) => {
      if (!current.has(customerId)) return current;
      const next = new Set(current);
      next.delete(customerId);
      return next;
    });
  }, []);

  // Brings back the completed/skipped stops of a trip stored on the device,
  // once that has loaded (the map keeps its trip from the first render on).
  // Trips stored before skipping kept stops open counted skipped ones as
  // handled — those come back as open.
  const restore = useCallback((state: { handledIds: string[]; skippedIds: string[] }) => {
    const skipped = new Set(state.skippedIds);
    setHandledIds(new Set(state.handledIds.filter((id) => !skipped.has(id))));
    setSkippedIds(skipped);
  }, []);

  // Undoes a skip/complete — removes the stop from handledIds so it becomes
  // pending again. Non-destructive by design (never touches the underlying
  // order), so no confirmation is required to call it.
  const reactivateStop = useCallback((customerId: string) => {
    setHandledIds((current) => {
      if (!current.has(customerId)) return current;
      const next = new Set(current);
      next.delete(customerId);
      return next;
    });
    setSkippedIds((current) => {
      if (!current.has(customerId)) return current;
      const next = new Set(current);
      next.delete(customerId);
      return next;
    });
    setDismissedIds((current) => {
      if (!current.has(customerId)) return current;
      const next = new Set(current);
      next.delete(customerId);
      return next;
    });
  }, []);

  return {
    currentMarker,
    pendingMarkers,
    // Pending stops minus the skipped ones — what the route line covers.
    routeMarkers,
    // Completed stop ids — the map marker for these stays visible (never
    // removed), just rendered muted/inactive instead of the normal
    // upcoming-stop color.
    handledIds,
    // Skipped stops — still pending (open), see RouteStopMarker's `skipped` prop.
    skippedIds,
    legOrigin,
    distanceToCurrentKm,
    arrivalPromptVisible,
    completingArrival,
    actionError,
    allDone,
    progressIndex: markers.length - pendingMarkers.length + (currentMarker ? 1 : 0),
    progressTotal: markers.length,
    confirmArrival,
    dismissArrival,
    markSkipped,
    restore,
    reactivateStop,
  };
}
