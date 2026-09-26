import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useMapCustomers } from "@/src/features/map/hooks/useMapCustomers";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { insertMarkersAfterAnchor } from "@/src/features/route/services/routeLiveReorderService";

// Loads the live route's markers in the order decided on the list screen.
// The route is not frozen to the ids it was started with: useMapCustomers
// already live-refreshes whenever the open orders in scope change, so a
// customer that shows up AFTER the trip began
// (an admin assigned it to this driver mid-drive) is slotted into the
// remaining route right away and reported via `addedMarkers`, instead of
// only appearing once the driver leaves and re-plans the route.
//
// Customers the driver already had open when the trip started but didn't
// pick for it are part of the first snapshot and stay out — only genuinely
// new assignments are added.
export function useLiveRouteMarkers(
  initialIds: string[],
  autoAddNewAssignments: boolean,
  // Read at insertion time, not as a dependency — the active stop changes on
  // every completion, which must not by itself re-trigger an insertion.
  getAnchorId: () => string | null,
) {
  const { markers, isLoading, error, reload } = useMapCustomers();
  const [routeIds, setRouteIds] = useState(initialIds);
  const [addedMarkers, setAddedMarkers] = useState<MapCustomerMarker[]>([]);
  const knownIdsRef = useRef<Set<string> | null>(null);
  const getAnchorIdRef = useRef(getAnchorId);
  useEffect(() => {
    getAnchorIdRef.current = getAnchorId;
  });

  const orderedMarkers = useMemo(() => {
    const markerById = new Map(markers.map((marker) => [marker.id, marker]));
    return routeIds.map((id) => markerById.get(id)).filter((marker) => marker !== undefined);
  }, [markers, routeIds]);

  // Reacts to an external data change (the live open-orders subscription),
  // not something derivable during render — the first loaded snapshot has
  // to be remembered as the baseline so later diffs can tell what's new.
  useEffect(() => {
    if (isLoading || error) return;

    const knownIds = knownIdsRef.current;
    if (!knownIds) {
      knownIdsRef.current = new Set([...markers.map((marker) => marker.id), ...routeIds]);
      return;
    }

    const fresh = markers.filter((marker) => !knownIds.has(marker.id));
    if (!fresh.length) return;
    fresh.forEach((marker) => knownIds.add(marker.id));

    if (!autoAddNewAssignments) return;

    const nextMarkers = insertMarkersAfterAnchor(orderedMarkers, fresh, getAnchorIdRef.current());
    setRouteIds(nextMarkers.map((marker) => marker.id));
    setAddedMarkers((current) => [...current, ...fresh]);
  }, [markers, isLoading, error, autoAddNewAssignments, orderedMarkers, routeIds]);

  const dismissAdded = useCallback(() => setAddedMarkers([]), []);

  // The driver re-sorted the remaining stops by hand: they go in exactly
  // this order behind every other stop (already completed/skipped ones,
  // which the navigation filters out of the pending sequence anyway).
  const reorderPending = useCallback((pendingIds: string[]) => {
    const moved = new Set(pendingIds);
    setRouteIds((current) => [...current.filter((id) => !moved.has(id)), ...pendingIds]);
  }, []);

  return { markers: orderedMarkers, isLoading, error, reload, addedMarkers, dismissAdded, reorderPending };
}
