import { useCallback, useMemo, useState } from "react";
import { mapT } from "@/src/features/map/i18n/mapT";

import { buildEmailExport, canStartSelectionExport, SelectionExportSnapshot } from "@/src/features/map/services/mapSelectionExportService";
import { useMapSelection } from "@/src/features/map/hooks/useMapSelection";
import { useSelectionSummary } from "@/src/features/map/hooks/useSelectionSummary";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { customerRepository } from "@/src/repositories/customerRepository";
import { emailService } from "@/src/services/emailService";
import { sharingService } from "@/src/services/sharingService";
import { useAppStore } from "@/src/store/appStore";
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
  const whatsappSelectionTemplate = useAppStore((state) => state.whatsappSelectionTemplate);
  const selection = useMapSelection(visibleMarkers);
  const summary = useSelectionSummary(selection.selectedIds);
  const [listVisible, setListVisible] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exportPreview, setExportPreview] = useState<SelectionExportSnapshot | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  // Permanently removes every selected customer (and, via
  // customerRepository.deleteCustomer, their orders) — irreversible, so the
  // caller must confirm before invoking this. Returns whether it succeeded
  // so the caller knows whether to reload the customer/marker list.
  const deleteSelectedCustomers = useCallback(async () => {
    setDeleteError(null);
    setDeleting(true);

    try {
      await Promise.all(selection.selectedIds.map((id) => customerRepository.deleteCustomer(id)));
      resetSelection();
      return true;
    } catch (error) {
      setDeleteError(formatError(error).message);
      return false;
    } finally {
      setDeleting(false);
    }
  }, [resetSelection, selection.selectedIds]);

  const share = useCallback(async () => {
    if (!canStartSelectionExport({ sharing, emailing })) return;

    setShareError(null);
    setSharing(true);

    try {
      const exportSnapshot = await buildSelectionExport({
        allMarkers,
        productEmojiById,
        selectedIds: selection.selectedIds,
        shareIncludeAddress,
        shareIncludePhone,
        shareIncludeTotals,
        shopName,
        messageTemplate: whatsappSelectionTemplate,
        summary,
      });
      setExportPreview(exportSnapshot);

      if (!exportSnapshot.message) {
        setShareError(t("errors.noCustomersSelected"));
        return;
      }

      await sharingService.shareText(exportSnapshot.message);
    } catch (error) {
      setShareError(formatError(error).message);
    } finally {
      setSharing(false);
    }
  }, [allMarkers, emailing, productEmojiById, selection.selectedIds, shareIncludeAddress, shareIncludePhone, shareIncludeTotals, sharing, shopName, summary, t, whatsappSelectionTemplate]);

  const shareByEmail = useCallback(async () => {
    if (!canStartSelectionExport({ sharing, emailing })) return;

    setShareError(null);
    setEmailing(true);

    try {
      const exportSnapshot = await buildSelectionExport({
        allMarkers,
        productEmojiById,
        selectedIds: selection.selectedIds,
        shareIncludeAddress,
        shareIncludePhone,
        shareIncludeTotals,
        shopName,
        summary,
      });
      setExportPreview(exportSnapshot);

      if (!exportSnapshot.message) {
        setShareError(t("errors.noCustomersSelected"));
        return;
      }

      await emailService.compose(shopName?.trim() || t("share.defaultSubject"), exportSnapshot.message);
    } catch (error) {
      setShareError(formatError(error).message);
    } finally {
      setEmailing(false);
    }
  }, [allMarkers, emailing, productEmojiById, selection.selectedIds, shareIncludeAddress, shareIncludePhone, shareIncludeTotals, sharing, shopName, summary, t]);

  return {
    selection,
    selectedMarkers,
    totals: summary.totals,
    totalsLoading: summary.isLoading,
    exportPreview,
    listVisible,
    sharing,
    emailing,
    deleting,
    shareError,
    deleteError,
    openList,
    closeList,
    resetSelection,
    deleteSelectedCustomers,
    share,
    shareByEmail,
  };
}

async function buildSelectionExport({
  allMarkers,
  productEmojiById,
  selectedIds,
  shareIncludeAddress,
  shareIncludePhone,
  shareIncludeTotals,
  shopName,
  messageTemplate,
  summary,
}: {
  allMarkers: MapCustomerMarker[];
  productEmojiById: Map<string, string | undefined>;
  selectedIds: string[];
  shareIncludeAddress: boolean;
  shareIncludePhone: boolean;
  shareIncludeTotals: boolean;
  shopName: string;
  messageTemplate?: string;
  summary: { ensureLoaded: (ids?: string[]) => Promise<import("@/src/types/order").OrderWithItems[]>; totals: import("@/src/types/productTotal").ProductTotal[] };
}) {
  const customerIds = [...new Set(selectedIds)];
  const orders = await summary.ensureLoaded(customerIds);

  return buildEmailExport({
    customerIds,
    markers: allMarkers,
    orders,
    productEmojiById,
    options: {
      includeAddress: shareIncludeAddress,
      includePhone: shareIncludePhone,
      includeTotal: shareIncludeTotals,
      shopName,
      messageTemplate,
    },
  });
}
