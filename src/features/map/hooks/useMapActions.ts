import { useCallback, useMemo, useState } from "react";
import { mapT } from "@/src/features/map/i18n/mapT";

import { MapCustomerDetails, MapCustomerMarker, NavigationAppId } from "@/src/features/map/types/mapTypes";
import { buildSelectionShareMessage, SelectionShareCustomer } from "@/src/features/map/services/mapShareFormatterService";
import { useProducts } from "@/src/features/products/hooks/useProducts";
import { orderRepository } from "@/src/repositories/orderRepository";
import { navigationService } from "@/src/services/navigationService";
import { phoneService } from "@/src/services/phoneService";
import { sharingService } from "@/src/services/sharingService";
import { geocodingService } from "@/src/services/geocodingService";
import { useAppStore } from "@/src/store/appStore";
import { formatError } from "@/src/utils/formatError";

export function useMapActions(details: MapCustomerDetails | null, marker: MapCustomerMarker | null) {
  const t = mapT;
  const shareIncludeAddress = useAppStore((state) => state.shareIncludeAddress);
  const shareIncludePhone = useAppStore((state) => state.shareIncludePhone);
  const shopName = useAppStore((state) => state.shopName);
  const { products } = useProducts();
  const productEmojiById = useMemo(() => new Map(products.map((product) => [product.id, product.emoji])), [products]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [completingOrder, setCompletingOrder] = useState(false);

  const callCustomer = useCallback(async () => {
    if (!details?.customer.phone) {
      setActionError(t("errors.noPhone"));
      return;
    }

    try {
      setActionError(null);
      await phoneService.call(details.customer.phone);
    } catch (error) {
      setActionError(formatError(error).message);
    }
  }, [details, t]);

  const openNavigationMenu = useCallback(async () => {
    if (!details && !marker) {
      setActionError(t("errors.noNavigationData"));
      return;
    }

    try {
      setActionError(null);
      await navigationService.openDefaultNavigation(buildNavigationTarget(details, marker));
    } catch (navigationError) {
      setActionError(formatError(navigationError).message);
    }
  }, [details, marker, t]);

  const openNavigationApp = useCallback(async (appId: NavigationAppId) => {
    if (!details && !marker) {
      setActionError(t("errors.noNavigationData"));
      return;
    }

    try {
      setActionError(null);
      await navigationService.openNavigationApp(appId, buildNavigationTarget(details, marker));
    } catch (error) {
      setActionError(formatError(error).message);
    }
  }, [details, marker, t]);

  const shareLocation = useCallback(async () => {
    if (!details || !marker) {
      setActionError(t("errors.locationNotReady"));
      return;
    }

    try {
      setActionError(null);
      await sharingService.shareText(
        sharingService.buildCustomerLocationMessage({
          fullName: details.customer.fullName,
          address: shareIncludeAddress
            ? `${details.customer.address}, ${details.customer.city}, ${details.customer.country}`
            : "",
          phone: shareIncludePhone ? details.customer.phone : "",
          latitude: marker.latitude,
          longitude: marker.longitude,
        }),
      );
    } catch (error) {
      setActionError(formatError(error).message);
    }
  }, [details, marker, shareIncludeAddress, shareIncludePhone, t]);

  const shareOrder = useCallback(async () => {
    if (!details) {
      setActionError(t("errors.noCustomerDataToShare"));
      return;
    }

    try {
      setActionError(null);
      const shareCustomer: SelectionShareCustomer = {
        fullName: details.customer.fullName,
        address: details.customer.address,
        phone: details.customer.phone,
        city: details.customer.city,
        note: details.customer.note,
        orderCount: details.openOrders.length,
        items: details.openOrders.flatMap((order) =>
          order.items.map((item) => ({
            productName: item.productNameSnapshot,
            quantity: item.quantity,
            unit: item.unit,
            emoji: productEmojiById.get(item.productId),
          })),
        ),
      };

      const message = buildSelectionShareMessage([shareCustomer], [], {
        includeAddress: shareIncludeAddress,
        includePhone: shareIncludePhone,
        includeTotal: false,
        shopName,
      });

      if (!message) {
        setActionError(t("errors.nothingToShare"));
        return;
      }

      await sharingService.shareText(message);
    } catch (error) {
      setActionError(formatError(error).message);
    }
  }, [details, productEmojiById, shareIncludeAddress, shareIncludePhone, shopName, t]);

  const completeOpenOrder = useCallback(async () => {
    if (!details?.openOrders.length) {
      setActionError(t("errors.noOpenOrderFound"));
      return false;
    }

    try {
      setActionError(null);
      setCompletingOrder(true);
      await Promise.all(details.openOrders.map((order) => orderRepository.completeOrder(order.id)));
      return true;
    } catch (error) {
      setActionError(formatError(error).message);
      return false;
    } finally {
      setCompletingOrder(false);
    }
  }, [details, t]);

  return {
    actionError,
    completingOrder,
    products,
    callCustomer,
    completeOpenOrder,
    openNavigationMenu,
    openNavigationApp,
    shareLocation,
    shareOrder,
    clearActionError: () => setActionError(null),
  };
}

function buildNavigationTarget(details: MapCustomerDetails | null, marker: MapCustomerMarker | null) {
  return {
    address: details
      ? geocodingService.composeAddress({
          address: details.customer.address,
          city: details.customer.city,
          country: details.customer.country,
          region: details.customer.region,
        })
      : undefined,
    latitude: marker?.latitude,
    longitude: marker?.longitude,
  };
}
