import * as Linking from "expo-linking";

import { MapNavigationApp, NavigationAppId } from "@/src/features/map/types/mapTypes";
import {
  NavigationTarget,
  buildAppleMapsUrl,
  buildGoogleMapsUrl,
  buildWazeUrl,
} from "@/src/services/navigationService.shared";

async function openIfAvailable(url: string, fallbackUrl?: string) {
  const supported = await safeCanOpenURL(url);

  if (supported) {
    return Linking.openURL(url);
  }

  if (fallbackUrl) {
    return Linking.openURL(fallbackUrl);
  }

  throw new Error("Navigations-App ist nicht verfuegbar.");
}

export const navigationService = {
  openAppleMaps(target: NavigationTarget) {
    return Linking.openURL(buildAppleMapsUrl(target));
  },

  openDefaultNavigation(target: NavigationTarget) {
    return this.openAppleMaps(target);
  },

  openGoogleMaps(target: NavigationTarget) {
    return openIfAvailable(
      buildGoogleMapsUrl(target),
      buildAppleMapsUrl(target),
    );
  },

  openWaze(target: NavigationTarget) {
    return openIfAvailable(
      buildWazeUrl(target),
      buildAppleMapsUrl(target),
    );
  },

  async getNavigationApps(
    target: NavigationTarget,
    preferredNavigationApp: NavigationAppId,
  ): Promise<MapNavigationApp[]> {
    const [googleMapsAvailable, wazeAvailable] = await Promise.all([
      safeCanOpenURL(buildGoogleMapsUrl(target)),
      safeCanOpenURL(buildWazeUrl(target)),
    ]);

    return sortNavigationApps([
      { id: "apple-maps", label: "Apple Maps", available: true },
      { id: "google-maps", label: "Google Maps", available: googleMapsAvailable },
      { id: "waze", label: "Waze", available: wazeAvailable },
    ], preferredNavigationApp);
  },

  openNavigationApp(appId: NavigationAppId, target: NavigationTarget) {
    if (appId === "google-maps") {
      return this.openGoogleMaps(target);
    }

    if (appId === "waze") {
      return this.openWaze(target);
    }

    return this.openAppleMaps(target);
  },
};

async function safeCanOpenURL(url: string) {
  try {
    return await Linking.canOpenURL(url);
  } catch {
    return false;
  }
}

function sortNavigationApps(apps: MapNavigationApp[], preferredNavigationApp: NavigationAppId) {
  return [...apps].sort((left, right) => {
    if (left.id === preferredNavigationApp) {
      return -1;
    }
    if (right.id === preferredNavigationApp) {
      return 1;
    }
    return 0;
  });
}
