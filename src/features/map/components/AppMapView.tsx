import { forwardRef, ReactNode, useImperativeHandle, useRef } from "react";
import { StyleProp, ViewStyle } from "react-native";
import MapView, { MapType, Region } from "react-native-maps";

import { AppMapViewHandle, LatLng, MapStyleKind } from "@/src/features/map/types/mapViewTypes";

const MAP_TYPES: Record<MapStyleKind, MapType> = {
  light: "mutedStandard",
  standard: "standard",
  satellite: "satellite",
  hybrid: "hybrid",
};

// iOS/default implementation — a thin passthrough to react-native-maps
// (Apple Maps on iOS). See AppMapView.android.tsx for the MapLibre/OpenFreeMap
// implementation Android resolves to instead (Metro's platform-extension
// convention — no code here decides which one loads).
type AppMapViewProps = {
  initialRegion: Region;
  onRegionChangeComplete?: (region: Region) => void;
  onPanDrag?: (event: { nativeEvent: { coordinate: LatLng } }) => void;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  showsCompass?: boolean;
  showsUserLocation?: boolean;
  // Android-only need (MapLibre has no built-in showsUserLocation dot that's
  // reliable on this app's RN version — see AppMapView.android.tsx). Unused
  // here since react-native-maps' showsUserLocation above already covers it.
  userLocationCoordinate?: LatLng | null;
  mapStyleKind?: MapStyleKind;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export const AppMapView = forwardRef<AppMapViewHandle, AppMapViewProps>(function AppMapView(
  { userLocationCoordinate: _userLocationCoordinate, mapStyleKind = "light", ...props },
  ref,
) {
  const mapRef = useRef<MapView | null>(null);

  useImperativeHandle(ref, () => ({
    animateToRegion(region) {
      mapRef.current?.animateToRegion(region);
    },
    fitToCoordinates(coordinates, options) {
      mapRef.current?.fitToCoordinates(coordinates, options);
    },
    animateCamera(config, options) {
      mapRef.current?.animateCamera(config, options);
    },
  }));

  // "light" (the default) is the muted base map without shop/POI clutter: a
  // calmer look that lets the colored customer pins stand out. The map always
  // stays light, like the rest of the app, regardless of the phone's dark mode.
  return (
    <MapView
      mapType={MAP_TYPES[mapStyleKind]}
      ref={mapRef}
      showsPointsOfInterests={mapStyleKind !== "light"}
      userInterfaceStyle="light"
      {...props}
    />
  );
});
