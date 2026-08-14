import { Platform } from "react-native";
import * as Linking from "expo-linking";

import { MapNavigationApp, NavigationAppId } from "@/src/features/map/types/mapTypes";
import {
  NavigationTarget,
  buildAppleMapsUrl,
  buildGeoUrl,
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

// Apple Maps only exists on iOS — Android has no equivalent, so its always-
// available native fallback is the system geo: chooser instead.
function nativeFallbackUrl(target: NavigationTarget) {
  return Platform.OS === "android" ? buildGeoUrl(target) : buildAppleMapsUrl(target);
}

export const navigationService = {
  openAppleMaps(target: NavigationTarget) {
    return Linking.openURL(buildAppleMapsUrl(target));
  },

  openDefaultNavigation(target: NavigationTarget) {
    if (Platform.OS === "android") {
      return openIfAvailable(buildGoogleMapsUrl(target), buildGeoUrl(target));
    }

    return this.openAppleMaps(target);
  },

  openGoogleMaps(target: NavigationTarget) {
    return openIfAvailable(
      buildGoogleMapsUrl(target),
      nativeFallbackUrl(target),
    );
  },

  openWaze(target: NavigationTarget) {
    return openIfAvailable(
      buildWazeUrl(target),
      nativeFallbackUrl(target),
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

    // Apple Maps has no Android equivalent, so it's not offered as a choice
    // there — openDefaultNavigation already covers the Android default.
    const apps: MapNavigationApp[] = Platform.OS === "android"
      ? []
      : [{ id: "apple-maps", label: "Apple Maps", available: true }];

    apps.push(
      { id: "google-maps", label: "Google Maps", available: googleMapsAvailable },
      { id: "waze", label: "Waze", available: wazeAvailable },
    );

    return sortNavigationApps(apps, preferredNavigationApp);
  },

  openNavigationApp(appId: NavigationAppId, target: NavigationTarget) {
    if (appId === "google-maps") {
      return this.openGoogleMaps(target);
    }

    if (appId === "waze") {
      return this.openWaze(target);
    }

    return this.openDefaultNavigation(target);
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
