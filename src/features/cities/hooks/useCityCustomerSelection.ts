import { useMemo, useState } from "react";

import { resetCustomerSelection, selectAllOpenCustomerIds, toggleCustomerSelection } from "@/src/features/cities/services/citySelectionService";
import { CityCustomerItem } from "@/src/features/cities/types/cityCustomerTypes";

export function useCityCustomerSelection(customers: CityCustomerItem[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedCount = selectedIds.length;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  return {
    selectedCount,
    isSelected: (customerId: string) => selectedSet.has(customerId),
    toggleSelection: (customerId: string) =>
      setSelectedIds((value) => toggleCustomerSelection(value, customerId)),
    selectAllOpen: () => setSelectedIds(selectAllOpenCustomerIds(customers)),
    resetSelection: () => setSelectedIds(resetCustomerSelection()),
  };
}
