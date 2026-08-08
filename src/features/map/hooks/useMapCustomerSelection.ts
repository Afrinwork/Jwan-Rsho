import { useCallback, useMemo, useState } from "react";

import { buildSelectionShareMessage, SelectionShareCustomer } from "@/src/features/map/services/mapShareFormatterService";
import { useMapSelection } from "@/src/features/map/hooks/useMapSelection";
import { useSelectionSummary } from "@/src/features/map/hooks/useSelectionSummary";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { sharingService } from "@/src/services/sharingService";
import { useAppStore } from "@/src/store/appStore";
import { buildProductTotals } from "@/src/utils/orderItemTotals";
import { OrderWithItems } from "@/src/types/order";
import { formatError } from "@/src/utils/formatError";

export function useMapCustomerSelection(allMarkers: MapCustomerMarker[], visibleMarkers: MapCustomerMarker[]) {
  const shareIncludeAddress = useAppStore((state) => state.shareIncludeAddress);
  const shareIncludePhone = useAppStore((state) => state.shareIncludePhone);
  const shareIncludeTotals = useAppStore((state) => state.shareIncludeTotals);
  const selection = useMapSelection(visibleMarkers);
  const summary = useSelectionSummary(selection.selectedIds);
  const [listVisible, setListVisible] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const selectedMarkers = useMemo(() => {
    const selectedIdSet = new Set(selection.selectedIds);
    return allMarkers.filter((marker) => selectedIdSet.has(marker.id));
  }, [allMarkers, selection.selectedIds]);

  const openList = useCallback(() => {
    setListVisible(true);
    void summary.ensureLoaded();
  }, [summary]);

  const closeList = useCallback(() => setListVisible(false), []);

  const resetSelection = useCallback(() => {
    selection.resetSelection();
    setShareError(null);
  }, [selection]);

  const share = useCallback(async () => {
    setShareError(null);
    setSharing(true);

    try {
      const orders = await summary.ensureLoaded();
      const message = buildSelectionShareMessage(
        buildShareCustomers(selectedMarkers, orders),
        buildProductTotals(orders),
        {
          includeAddress: shareIncludeAddress,
          includePhone: shareIncludePhone,
          includeTotal: shareIncludeTotals,
        },
      );

      if (!message) {
        setShareError("Es sind keine Kunden ausgewaehlt.");
        return;
      }

      await sharingService.shareText(message);
    } catch (error) {
      setShareError(formatError(error).message);
    } finally {
      setSharing(false);
    }
  }, [selectedMarkers, shareIncludeAddress, shareIncludePhone, shareIncludeTotals, summary]);

  return {
    selection,
    selectedMarkers,
    totals: summary.totals,
    totalsLoading: summary.isLoading,
    listVisible,
    sharing,
    shareError,
    openList,
    closeList,
    resetSelection,
    share,
  };
}

function buildShareCustomers(markers: MapCustomerMarker[], orders: OrderWithItems[]): SelectionShareCustomer[] {
  const ordersByCustomerId = new Map(orders.map((order) => [order.customerId, order]));

  return markers.map((marker) => ({
    fullName: marker.title,
    address: marker.description,
    phone: marker.phone,
    city: marker.city,
    items: (ordersByCustomerId.get(marker.id)?.items ?? []).map((item) => ({
      productName: item.productNameSnapshot,
      quantity: item.quantity,
      unit: item.unit,
    })),
  }));
}
