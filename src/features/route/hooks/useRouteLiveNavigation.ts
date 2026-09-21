import { useCallback, useMemo, useState } from "react";

import { distanceKm } from "@/src/features/map/utils/circleMath";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { formatError } from "@/src/utils/formatError";

const ARRIVAL_THRESHOLD_KM = 0.12;

export function useRouteLiveNavigation(markers: MapCustomerMarker[], liveCoordinate: { latitude: number; longitude: number } | null) {
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());
  // Subset of handledIds that were skipped rather than completed — an order
  // that couldn't be delivered still needs to stay visibly distinct on the
  // map (see RouteStopMarker/routeStopMarkerStyleService) so the driver
  // knows which stops still need a revisit vs. which are actually done.
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [completingArrival, setCompletingArrival] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // Coordinates of the most recently completed/skipped stop — once set, the
  // remaining route is recalculated from here instead of the original start
  // location, so "distance/route to next address" always starts fresh from
  // wherever the driver just finished.
  const [legOrigin, setLegOrigin] = useState<{ latitude: number; longitude: number } | null>(null);

  const pendingMarkers = useMemo(() => markers.filter((marker) => !handledIds.has(marker.id)), [markers, handledIds]);
  const currentMarker = pendingMarkers[0] ?? null;
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
  // react to a successful arrival (e.g. advancing the delivery-navigation
  // reducer's own stop index) can't just assume success, since this can fail.
  const confirmArrival = useCallback(async (): Promise<boolean> => {
    if (!currentMarker) return false;

    setActionError(null);
    setCompletingArrival(true);

    try {
      const orders = await orderDetailsRepository.getOpenOrdersWithItemsByCustomerIds([currentMarker.id]);
      await Promise.all(orders.map((order) => orderRepository.completeOrder(order.id)));
      setHandledIds((current) => new Set(current).add(currentMarker.id));
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

  // Deliberately does NOT touch legOrigin, unlike confirmArrival above — a
  // skipped stop was never actually visited, so the remaining route must
  // keep departing from wherever it already was (the last stop actually
  // completed, or the original start) straight to the next pending stop,
  // not from the skipped stop's own address. E.g. skipping stop 2 of
  // 1→2→3 must route 1→3 directly, not 2→3.
  const skipStop = useCallback(() => {
    if (!currentMarker) return;
    setHandledIds((current) => new Set(current).add(currentMarker.id));
    setSkippedIds((current) => new Set(current).add(currentMarker.id));
  }, [currentMarker]);

  const skipToMarker = useCallback((customerId: string) => {
    const targetIndex = markers.findIndex((marker) => marker.id === customerId);
    if (targetIndex === -1) return;
    const skippedOver = markers.slice(0, targetIndex).map((marker) => marker.id);

    setHandledIds((current) => {
      const next = new Set(current);
      skippedOver.forEach((id) => next.add(id));
      next.delete(customerId);
      return next;
    });
    setSkippedIds((current) => {
      const next = new Set(current);
      skippedOver.forEach((id) => next.add(id));
      next.delete(customerId);
      return next;
    });
    setDismissedIds((current) => {
      if (!current.has(customerId)) return current;
      const next = new Set(current);
      next.delete(customerId);
      return next;
    });
  }, [markers]);

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
    // Completed/skipped stop ids — the map marker for these stays visible
    // (never removed), just rendered muted/inactive instead of the normal
    // upcoming-stop color.
    handledIds,
    // Subset of handledIds that were skipped, not completed — see
    // RouteStopMarker's `skipped` prop.
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
    skipStop,
    skipToMarker,
    reactivateStop,
  };
}
