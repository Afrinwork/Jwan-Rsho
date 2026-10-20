export type LatLng = { latitude: number; longitude: number };

// The base map look the driver picks on the map screen. Same four choices on
// iOS (Apple Maps map types) and Android (MapLibre styles), so a driver
// switching phones finds the same map.
export type MapStyleKind = "light" | "standard" | "satellite" | "hybrid";

export const MAP_STYLE_KINDS: MapStyleKind[] = ["light", "standard", "satellite", "hybrid"];

export type EdgePadding ={ top: number; right: number; bottom: number; left: number };

// The three imperative camera calls the app actually makes today (see
// MapScreen.tsx and RouteLiveScreen.tsx) — kept minimal and shaped to match
// those exact call sites, so AppMapView's iOS (react-native-maps) and Android
// (MapLibre) implementations both satisfy the same contract from the caller's
// point of view.
export type AppMapViewHandle = {
  animateToRegion(region: LatLng & { latitudeDelta: number; longitudeDelta: number }): void;
  fitToCoordinates(coordinates: LatLng[], options: { animated?: boolean; edgePadding: EdgePadding }): void;
  animateCamera(config: { center: LatLng; zoom: number }, options: { duration: number }): void;
};
