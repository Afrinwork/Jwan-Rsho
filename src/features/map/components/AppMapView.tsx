import { forwardRef, ReactNode, useImperativeHandle, useRef } from "react";
import { StyleProp, ViewStyle } from "react-native";
import MapView, { Region } from "react-native-maps";

import { AppMapViewHandle, LatLng } from "@/src/features/map/types/mapViewTypes";

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
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export const AppMapView = forwardRef<AppMapViewHandle, AppMapViewProps>(function AppMapView(
  { userLocationCoordinate: _userLocationCoordinate, ...props },
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

  return <MapView ref={mapRef} {...props} />;
});
