import { useMemo, useState } from "react";

import { resetCustomerSelection, selectAllCustomerIds, toggleCustomerSelection } from "@/src/features/cities/services/citySelectionService";
import { CityCustomerItem } from "@/src/features/cities/types/cityCustomerTypes";

export function useCityCustomerSelection(customers: CityCustomerItem[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const visibleCustomerIds = useMemo(
    () => customers.map((value) => value.id),
    [customers],
  );
  const visibleCustomerIdSet = useMemo(
    () => new Set(visibleCustomerIds),
    [visibleCustomerIds],
  );

  // Drops selected ids that are no longer visible (e.g. filtered out by
  // search) whenever the visible set changes — adjusted directly during
  // render (React's documented pattern for "reset state when a prop
  // changes") rather than in an effect. `prevVisibleCustomerIdSet` mirrors
  // the effect's old [visibleCustomerIdSet] dependency, which also compared
  // by the memoized Set's identity.
  const [prevVisibleCustomerIdSet, setPrevVisibleCustomerIdSet] = useState(visibleCustomerIdSet);
  if (visibleCustomerIdSet !== prevVisibleCustomerIdSet) {
    setPrevVisibleCustomerIdSet(visibleCustomerIdSet);
    setSelectedIds((value) => {
      const nextValue = value.filter((customerId) => visibleCustomerIdSet.has(customerId));
      return nextValue.length === value.length ? value : nextValue;
    });
  }

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCount = selectedIds.length;
  const allSelected =
    visibleCustomerIds.length > 0 &&
    visibleCustomerIds.every((customerId) => selectedSet.has(customerId));

  return {
    selectedIds,
    selectedCount,
    hasSelection: selectedCount > 0,
    allSelected,
    isSelected: (customerId: string) => selectedSet.has(customerId),
    toggleSelection: (customerId: string) =>
      setSelectedIds((value) => toggleCustomerSelection(value, customerId)),
    selectAll: () => setSelectedIds(selectAllCustomerIds(customers)),
    clearSelection: () => setSelectedIds(resetCustomerSelection()),
    toggleSelectAll: () =>
      setSelectedIds((value) =>
        visibleCustomerIds.length > 0 &&
        visibleCustomerIds.every((customerId) => value.includes(customerId))
          ? resetCustomerSelection()
          : selectAllCustomerIds(customers),
      ),
  };
}
