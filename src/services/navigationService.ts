import { Platform } from "react-native";
import * as Linking from "expo-linking";

import { MapNavigationApp, NavigationAppId } from "@/src/features/map/types/mapTypes";
import {
  NavigationTarget,
  NavigationWaypoint,
  buildAppleMapsUrl,
  buildGeoUrl,
  buildGoogleMapsMultiStopAppUrl,
  buildGoogleMapsMultiStopWebUrl,
  buildGoogleMapsUrl,
  buildGoogleMapsWebUrl,
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
      return this.openGoogleMaps(target);
    }

    return this.openAppleMaps(target);
  },

  // Android: the universal link (see buildGoogleMapsWebUrl) — opened
  // directly, canOpenURL can't see https handlers without a manifest query.
  openGoogleMaps(target: NavigationTarget) {
    if (Platform.OS === "android") {
      return Linking.openURL(buildGoogleMapsWebUrl(target)).catch(() => Linking.openURL(buildGeoUrl(target)));
    }

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

  // Opens driving directions through every stop in order (like typing
  // several addresses into Google Maps and pressing start) — Apple Maps has
  // no reliable multi-stop URL scheme, so this always goes through Google
  // Maps (app if installed, otherwise the web/browser fallback).
  openMultiStopDrivingRoute(origin: NavigationWaypoint, waypoints: NavigationWaypoint[]) {
    if (Platform.OS === "android") {
      return Linking.openURL(buildGoogleMapsMultiStopWebUrl(origin, waypoints));
    }

    return openIfAvailable(
      buildGoogleMapsMultiStopAppUrl(origin, waypoints),
      buildGoogleMapsMultiStopWebUrl(origin, waypoints),
    );
  },

  async getNavigationApps(
    target: NavigationTarget,
    preferredNavigationApp: NavigationAppId,
  ): Promise<MapNavigationApp[]> {
    // The Android link always opens something (app, else browser).
    const [googleMapsAvailable, wazeAvailable] = await Promise.all([
      Platform.OS === "android" ? true : safeCanOpenURL(buildGoogleMapsUrl(target)),
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
