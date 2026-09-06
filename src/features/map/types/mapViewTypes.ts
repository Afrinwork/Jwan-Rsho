export type LatLng = { latitude: number; longitude: number };

export type EdgePadding = { top: number; right: number; bottom: number; left: number };

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
