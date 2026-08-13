import { useCallback, useMemo, useState } from "react";
import { mapT } from "@/src/features/map/i18n/mapT";

import { buildSelectionShareMessage, SelectionShareCustomer, SelectionShareItem } from "@/src/features/map/services/mapShareFormatterService";
import { useMapSelection } from "@/src/features/map/hooks/useMapSelection";
import { useSelectionSummary } from "@/src/features/map/hooks/useSelectionSummary";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { emailService } from "@/src/services/emailService";
import { sharingService } from "@/src/services/sharingService";
import { useAppStore } from "@/src/store/appStore";
import { buildProductTotals } from "@/src/utils/orderItemTotals";
import { OrderWithItems } from "@/src/types/order";
import { ProductTotal } from "@/src/types/productTotal";
import { formatError } from "@/src/utils/formatError";

export function useMapCustomerSelection(
  allMarkers: MapCustomerMarker[],
  visibleMarkers: MapCustomerMarker[],
  productEmojiById: Map<string, string | undefined>,
) {
  const t = mapT;
  const shopName = useAppStore((state) => state.shopName);
  const shareIncludeAddress = useAppStore((state) => state.shareIncludeAddress);
  const shareIncludePhone = useAppStore((state) => state.shareIncludePhone);
  const shareIncludeTotals = useAppStore((state) => state.shareIncludeTotals);
  const selection = useMapSelection(visibleMarkers);
  const summary = useSelectionSummary(selection.selectedIds);
  const [listVisible, setListVisible] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [emailing, setEmailing] = useState(false);
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
      const message = await buildSelectionMessage({
        productEmojiById,
        selectedMarkers,
        shareIncludeAddress,
        shareIncludePhone,
        shareIncludeTotals,
        shopName,
        summary,
      });

      if (!message) {
        setShareError(t("errors.noCustomersSelected"));
        return;
      }

      await sharingService.shareText(message);
    } catch (error) {
      setShareError(formatError(error).message);
    } finally {
      setSharing(false);
    }
  }, [productEmojiById, selectedMarkers, shareIncludeAddress, shareIncludePhone, shareIncludeTotals, shopName, summary, t]);

  const shareByEmail = useCallback(async () => {
    setShareError(null);
    setEmailing(true);

    try {
      const message = await buildSelectionMessage({
        productEmojiById,
        selectedMarkers,
        shareIncludeAddress,
        shareIncludePhone,
        shareIncludeTotals,
        shopName,
        summary,
      });

      if (!message) {
        setShareError(t("errors.noCustomersSelected"));
        return;
      }

      await emailService.compose(shopName?.trim() || t("share.defaultSubject"), message);
    } catch (error) {
      setShareError(formatError(error).message);
    } finally {
      setEmailing(false);
    }
  }, [productEmojiById, selectedMarkers, shareIncludeAddress, shareIncludePhone, shareIncludeTotals, shopName, summary, t]);

  return {
    selection,
    selectedMarkers,
    totals: summary.totals,
    totalsLoading: summary.isLoading,
    listVisible,
    sharing,
    emailing,
    shareError,
    openList,
    closeList,
    resetSelection,
    share,
    shareByEmail,
  };
}

async function buildSelectionMessage({
  productEmojiById,
  selectedMarkers,
  shareIncludeAddress,
  shareIncludePhone,
  shareIncludeTotals,
  shopName,
  summary,
}: {
  productEmojiById: Map<string, string | undefined>;
  selectedMarkers: MapCustomerMarker[];
  shareIncludeAddress: boolean;
  shareIncludePhone: boolean;
  shareIncludeTotals: boolean;
  shopName: string;
  summary: { ensureLoaded: () => Promise<OrderWithItems[]> };
}) {
  const orders = await summary.ensureLoaded();

  return buildSelectionShareMessage(
    buildShareCustomers(selectedMarkers, orders, productEmojiById),
    enrichTotalsWithEmoji(buildProductTotals(orders), productEmojiById),
    {
      includeAddress: shareIncludeAddress,
      includePhone: shareIncludePhone,
      includeTotal: shareIncludeTotals,
      shopName,
    },
  );
}

function buildShareCustomers(
  markers: MapCustomerMarker[],
  orders: OrderWithItems[],
  productEmojiById: Map<string, string | undefined>,
): SelectionShareCustomer[] {
  const ordersByCustomerId = new Map<string, OrderWithItems[]>();
  orders.forEach((order) => {
    ordersByCustomerId.set(order.customerId, [...(ordersByCustomerId.get(order.customerId) ?? []), order]);
  });

  return markers.map((marker) => {
    const customerOrders = ordersByCustomerId.get(marker.id) ?? [];

    return {
      fullName: marker.title,
      address: marker.description,
      phone: marker.phone,
      city: marker.city,
      note: marker.note,
      orderCount: customerOrders.length,
      items: customerOrders.flatMap((order) =>
        order.items.map((item) => ({
          productName: item.productNameSnapshot,
          quantity: item.quantity,
          unit: item.unit,
          emoji: productEmojiById.get(item.productId),
        })),
      ),
    };
  });
}

// ProductTotal.productKey is built as `${productId}:${unit}` (see src/utils/orderItemTotals.ts),
// so the productId can be recovered from it to look up that product's current emoji.
function enrichTotalsWithEmoji(
  totals: ProductTotal[],
  productEmojiById: Map<string, string | undefined>,
): SelectionShareItem[] {
  return totals.map((total) => ({
    productName: total.productName,
    quantity: total.quantity,
    unit: total.unit,
    emoji: productEmojiById.get(total.productKey.split(":")[0]),
  }));
}
