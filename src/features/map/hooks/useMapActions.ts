import { useCallback, useState } from "react";

import { MapCustomerDetails, MapCustomerMarker, MapNavigationApp, NavigationAppId } from "@/src/features/map/types/mapTypes";
import { navigationService } from "@/src/services/navigationService";
import { phoneService } from "@/src/services/phoneService";
import { sharingService } from "@/src/services/sharingService";
import { useAppStore } from "@/src/store/appStore";
import { formatError } from "@/src/utils/formatError";

export function useMapActions(details: MapCustomerDetails | null, marker: MapCustomerMarker | null) {
  const preferredNavigationApp = useAppStore((state) => state.preferredNavigationApp);
  const shareIncludeAddress = useAppStore((state) => state.shareIncludeAddress);
  const shareIncludePhone = useAppStore((state) => state.shareIncludePhone);
  const [actionError, setActionError] = useState<string | null>(null);
  const [navigationApps, setNavigationApps] = useState<MapNavigationApp[]>([]);
  const [navigationSheetVisible, setNavigationSheetVisible] = useState(false);

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
    if (!marker) {
      setActionError("Keine Koordinaten fuer Navigation vorhanden.");
      return;
    }

    try {
      setActionError(null);
      setNavigationApps(await navigationService.getNavigationApps(marker, preferredNavigationApp));
      setNavigationSheetVisible(true);
    } catch (error) {
      setActionError(formatError(error).message);
    }
  }, [marker, preferredNavigationApp]);

  const openNavigationApp = useCallback(async (appId: NavigationAppId) => {
    if (!marker) {
      setActionError("Keine Koordinaten fuer Navigation vorhanden.");
      return;
    }

    try {
      setActionError(null);
      await navigationService.openNavigationApp(appId, marker);
      setNavigationSheetVisible(false);
    } catch (error) {
      setActionError(formatError(error).message);
    }
  }, [marker]);

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
            ? `${details.customer.street} ${details.customer.houseNumber}, ${details.customer.postalCode} ${details.customer.city}, ${details.customer.country}`
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

  return {
    actionError,
    navigationApps,
    navigationSheetVisible,
    callCustomer,
    openNavigationMenu,
    openNavigationApp,
    shareLocation,
    clearActionError: () => setActionError(null),
    closeNavigationSheet: () => setNavigationSheetVisible(false),
  };
}
