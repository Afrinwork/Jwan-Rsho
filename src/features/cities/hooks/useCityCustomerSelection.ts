import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    setSelectedIds((value) => {
      const nextValue = value.filter((customerId) => visibleCustomerIdSet.has(customerId));
      return nextValue.length === value.length ? value : nextValue;
    });
  }, [visibleCustomerIdSet]);

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
