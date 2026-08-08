import * as Linking from "expo-linking";

import { MapNavigationApp, NavigationAppId } from "@/src/features/map/types/mapTypes";
import {
  buildAppleMapsUrl,
  buildGoogleMapsUrl,
  buildWazeUrl,
} from "@/src/services/navigationService.shared";

type Coordinate = {
  latitude: number;
  longitude: number;
};

async function openIfAvailable(url: string, fallbackUrl?: string) {
  const supported = await Linking.canOpenURL(url);

  if (supported) {
    return Linking.openURL(url);
  }

  if (fallbackUrl) {
    return Linking.openURL(fallbackUrl);
  }

  throw new Error("Navigations-App ist nicht verfuegbar.");
}

export const navigationService = {
  openAppleMaps({ latitude, longitude }: Coordinate) {
    return Linking.openURL(buildAppleMapsUrl({ latitude, longitude }));
  },

  openDefaultNavigation(coordinate: Coordinate) {
    return this.openAppleMaps(coordinate);
  },

  openGoogleMaps({ latitude, longitude }: Coordinate) {
    return openIfAvailable(
      buildGoogleMapsUrl({ latitude, longitude }),
      buildAppleMapsUrl({ latitude, longitude }),
    );
  },

  openWaze({ latitude, longitude }: Coordinate) {
    return openIfAvailable(
      buildWazeUrl({ latitude, longitude }),
      buildAppleMapsUrl({ latitude, longitude }),
    );
  },

  async getNavigationApps(
    coordinate: Coordinate,
    preferredNavigationApp: NavigationAppId,
  ): Promise<MapNavigationApp[]> {
    const [googleMapsAvailable, wazeAvailable] = await Promise.all([
      Linking.canOpenURL(buildGoogleMapsUrl(coordinate)),
      Linking.canOpenURL(buildWazeUrl(coordinate)),
    ]);

    return sortNavigationApps([
      { id: "apple-maps", label: "Apple Maps", available: true },
      { id: "google-maps", label: "Google Maps", available: googleMapsAvailable },
      { id: "waze", label: "Waze", available: wazeAvailable },
    ], preferredNavigationApp);
  },

  openNavigationApp(appId: NavigationAppId, coordinate: Coordinate) {
    if (appId === "google-maps") {
      return this.openGoogleMaps(coordinate);
    }

    if (appId === "waze") {
      return this.openWaze(coordinate);
    }

    return this.openAppleMaps(coordinate);
  },
};

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
