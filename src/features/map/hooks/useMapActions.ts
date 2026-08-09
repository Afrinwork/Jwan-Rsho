import { useCallback, useState } from "react";

import { MapCustomerDetails, MapCustomerMarker, MapNavigationApp, NavigationAppId } from "@/src/features/map/types/mapTypes";
import { orderRepository } from "@/src/repositories/orderRepository";
import { navigationService } from "@/src/services/navigationService";
import { phoneService } from "@/src/services/phoneService";
import { sharingService } from "@/src/services/sharingService";
import { geocodingService } from "@/src/services/geocodingService";
import { useAppStore } from "@/src/store/appStore";
import { formatError } from "@/src/utils/formatError";

export function useMapActions(details: MapCustomerDetails | null, marker: MapCustomerMarker | null) {
  const preferredNavigationApp = useAppStore((state) => state.preferredNavigationApp);
  const shareIncludeAddress = useAppStore((state) => state.shareIncludeAddress);
  const shareIncludePhone = useAppStore((state) => state.shareIncludePhone);
  const [actionError, setActionError] = useState<string | null>(null);
  const [navigationApps, setNavigationApps] = useState<MapNavigationApp[]>([]);
  const [navigationSheetVisible, setNavigationSheetVisible] = useState(false);
  const [completingOrder, setCompletingOrder] = useState(false);

  const callCustomer = useCallback(async () => {
    if (!details?.customer.phone) {
      setActionError("Keine Telefonnummer fuer diesen Kunden vorhanden.");
      return;
    }

    try {
      setActionError(null);
      await phoneService.call(details.customer.phone);
    } catch (error) {
      setActionError(formatError(error).message);
    }
  }, [details]);

  const openNavigationMenu = useCallback(async () => {
    if (!details && !marker) {
      setActionError("Keine Navigationsdaten fuer diesen Kunden vorhanden.");
      return;
    }

    try {
      setActionError(null);
      setNavigationApps(await navigationService.getNavigationApps(buildNavigationTarget(details, marker), preferredNavigationApp));
      setNavigationSheetVisible(true);
    } catch (error) {
      setActionError(formatError(error).message);
    }
  }, [details, marker, preferredNavigationApp]);

  const openNavigationApp = useCallback(async (appId: NavigationAppId) => {
    if (!details && !marker) {
      setActionError("Keine Navigationsdaten fuer diesen Kunden vorhanden.");
      return;
    }

    try {
      setActionError(null);
      await navigationService.openNavigationApp(appId, buildNavigationTarget(details, marker));
      setNavigationSheetVisible(false);
    } catch (error) {
      setActionError(formatError(error).message);
    }
  }, [details, marker]);

  const shareLocation = useCallback(async () => {
    if (!details || !marker) {
      setActionError("Standortdaten sind noch nicht verfuegbar.");
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
  }, [details, marker, shareIncludeAddress, shareIncludePhone]);

  const completeOpenOrder = useCallback(async () => {
    if (!details?.openOrder?.id) {
      setActionError("Keine offene Bestellung fuer diesen Kunden gefunden.");
      return false;
    }

    try {
      setActionError(null);
      setCompletingOrder(true);
      await orderRepository.completeOrder(details.openOrder.id);
      return true;
    } catch (error) {
      setActionError(formatError(error).message);
      return false;
    } finally {
      setCompletingOrder(false);
    }
  }, [details]);

  return {
    actionError,
    completingOrder,
    navigationApps,
    navigationSheetVisible,
    callCustomer,
    completeOpenOrder,
    openNavigationMenu,
    openNavigationApp,
    shareLocation,
    clearActionError: () => setActionError(null),
    closeNavigationSheet: () => setNavigationSheetVisible(false),
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
