import { useCallback, useMemo, useState } from "react";

import { distanceKm } from "@/src/features/map/utils/circleMath";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { formatError } from "@/src/utils/formatError";

const ARRIVAL_THRESHOLD_KM = 0.12;

export function useRouteLiveNavigation(markers: MapCustomerMarker[], liveCoordinate: { latitude: number; longitude: number } | null) {
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());
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

  const skipStop = useCallback(() => {
    if (!currentMarker) return;
    setHandledIds((current) => new Set(current).add(currentMarker.id));
    setLegOrigin({ latitude: currentMarker.latitude, longitude: currentMarker.longitude });
  }, [currentMarker]);

  return {
    currentMarker,
    pendingMarkers,
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
  };
}
