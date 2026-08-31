import { useMemo } from "react";

import { useMapCustomers } from "@/src/features/map/hooks/useMapCustomers";

// Loads the full marker data for a list of customer ids, preserving the given
// order — used on the live map, which trusts the order already decided on
// the list screen rather than re-sorting.
export function useOrderedMarkers(orderedIds: string[]) {
  const { markers, isLoading, error, reload } = useMapCustomers();

  const orderedMarkers = useMemo(() => {
    const markerById = new Map(markers.map((marker) => [marker.id, marker]));
    return orderedIds.map((id) => markerById.get(id)).filter((marker) => marker !== undefined);
  }, [markers, orderedIds]);

  return { markers: orderedMarkers, isLoading, error, reload };
}
