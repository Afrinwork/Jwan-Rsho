import { useMemo, useState } from "react";

import { resetStopSelection, selectAllStopIds, toggleStopSelection } from "@/src/features/route/services/routeSelectionService";
import { RouteStop } from "@/src/features/route/types/routeTypes";

export function useRouteSelection(stops: RouteStop[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const stopIds = useMemo(() => stops.map((stop) => stop.marker.id), [stops]);
  const stopIdSet = useMemo(() => new Set(stopIds), [stopIds]);

  // Drops selected ids that are no longer among the stops whenever the stop
  // set changes — adjusted directly during render (React's documented
  // pattern for "reset state when a prop changes") rather than in an
  // effect. `prevStopIdSet` mirrors the effect's old [stopIdSet]
  // dependency, which also compared by the memoized Set's identity.
  const [prevStopIdSet, setPrevStopIdSet] = useState(stopIdSet);
  if (stopIdSet !== prevStopIdSet) {
    setPrevStopIdSet(stopIdSet);
    setSelectedIds((value) => {
      const nextValue = value.filter((id) => stopIdSet.has(id));
      return nextValue.length === value.length ? value : nextValue;
    });
  }

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCount = selectedIds.length;
  const allSelected = stopIds.length > 0 && stopIds.every((id) => selectedSet.has(id));

  return {
    selectedIds,
    selectedCount,
    hasSelection: selectedCount > 0,
    allSelected,
    isSelected: (stopId: string) => selectedSet.has(stopId),
    toggleSelection: (stopId: string) => setSelectedIds((value) => toggleStopSelection(value, stopId)),
    selectAll: () => setSelectedIds(selectAllStopIds(stops)),
    clearSelection: () => setSelectedIds(resetStopSelection()),
    toggleSelectAll: () =>
      setSelectedIds((value) =>
        stopIds.length > 0 && stopIds.every((id) => value.includes(id)) ? resetStopSelection() : selectAllStopIds(stops),
      ),
  };
}
