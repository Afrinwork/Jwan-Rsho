import { ReactNode, forwardRef, useImperativeHandle, useRef } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Camera, CameraRef, Map, MapRef } from "@maplibre/maplibre-react-native";

import { UserLocationDot } from "@/src/features/map/components/UserLocationDot.android";
import { boundsFromCoordinates } from "@/src/features/map/utils/geoBounds";
import { AppMapViewHandle, LatLng } from "@/src/features/map/types/mapViewTypes";

// Free, no-API-key vector style (OpenFreeMap "Liberty") — this is the whole
// point of this file existing instead of react-native-maps' Google-Maps-on-
// Android default, which needs a billed Google Cloud project. If this hosted
// style ever becomes unavailable, OpenFreeMap also publishes the same
// OpenMapTiles-derived dataset as a self-hostable Docker image — only this
// constant would need to change, nothing else in the app.
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

// MapLibre's Camera works in zoom levels, not lat/lng deltas — this is the
// standard Web-Mercator approximation (doubling the visible span halves the
// zoom level). Good enough for the two call sites that need it; nothing here
// requires pixel-perfect parity with react-native-maps' own conversion.
function deltaToZoom(latitudeDelta: number) {
  return Math.log2(360 / latitudeDelta);
}

function zoomToDelta(zoom: number) {
  return 360 / Math.pow(2, zoom);
}

type AppMapViewProps = {
  initialRegion: LatLng & { latitudeDelta: number; longitudeDelta: number };
  onRegionChangeComplete?: (region: LatLng & { latitudeDelta: number; longitudeDelta: number }) => void;
  onPanDrag?: (event: { nativeEvent: { coordinate: LatLng } }) => void;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  showsCompass?: boolean;
  showsUserLocation?: boolean;
  // MapLibre's own built-in user-location dot has a known bug under React
  // Native's New Architecture on Android (doesn't update) — this app runs
  // New Architecture by default, and this library requires it, so that bug
  // can't be dodged by picking a different library version either. Instead
  // we render a plain marker ourselves from location data the screen already
  // has (see UserLocationDot.android.tsx).
  userLocationCoordinate?: LatLng | null;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export const AppMapView = forwardRef<AppMapViewHandle, AppMapViewProps>(function AppMapView(
  {
    initialRegion,
    onRegionChangeComplete,
    onPanDrag,
    pitchEnabled = true,
    rotateEnabled = true,
    scrollEnabled = true,
    zoomEnabled = true,
    showsCompass,
    showsUserLocation,
    userLocationCoordinate,
    style,
    children,
  },
  ref,
) {
  const mapRef = useRef<MapRef | null>(null);
  const cameraRef = useRef<CameraRef | null>(null);

  useImperativeHandle(ref, () => ({
    animateToRegion(region) {
      cameraRef.current?.easeTo({
        center: [region.longitude, region.latitude],
        zoom: deltaToZoom(region.latitudeDelta),
        duration: 500,
      });
    },
    fitToCoordinates(coordinates, options) {
      if (coordinates.length === 0) return;
      cameraRef.current?.fitBounds(boundsFromCoordinates(coordinates), {
        padding: options.edgePadding,
        duration: options.animated === false ? 0 : 500,
      });
    },
    animateCamera(config, options) {
      cameraRef.current?.easeTo({
        center: [config.center.longitude, config.center.latitude],
        zoom: config.zoom,
        duration: options.duration,
      });
    },
  }));

  // Only needed while the caller has actually disabled the map's own pan
  // gesture to draw a polygon (see MapScreen.tsx's mapGesturesEnabled) —
  // otherwise this transparent layer would swallow normal map panning.
  const captureDragGestures = Boolean(onPanDrag) && scrollEnabled === false;

  const dragGesture = Gesture.Pan().onUpdate((event) => {
    if (!onPanDrag) return;
    // unproject is async (bridges to the native view) — the app's own
    // polygon-drag throttling (50ms + minimum distance, in useMapSelection.ts)
    // already collapses excess points downstream, so no extra throttling is
    // needed here.
    void mapRef.current?.unproject([event.x, event.y]).then((lngLat) => {
      onPanDrag({ nativeEvent: { coordinate: { latitude: lngLat[1], longitude: lngLat[0] } } });
    });
  });

  return (
    <View style={style}>
      <Map
        compass={showsCompass}
        dragPan={scrollEnabled}
        mapStyle={MAP_STYLE_URL}
        onRegionDidChange={(event) => {
          if (!onRegionChangeComplete) return;
          const { center, zoom } = event.nativeEvent;
          onRegionChangeComplete({
            latitude: center[1],
            longitude: center[0],
            latitudeDelta: zoomToDelta(zoom),
            longitudeDelta: zoomToDelta(zoom),
          });
        }}
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        touchPitch={pitchEnabled}
        touchRotate={rotateEnabled}
        touchZoom={zoomEnabled}
      >
        <Camera
          initialViewState={{
            center: [initialRegion.longitude, initialRegion.latitude],
            zoom: deltaToZoom(initialRegion.latitudeDelta),
          }}
          ref={cameraRef}
        />
        {showsUserLocation && userLocationCoordinate ? <UserLocationDot coordinate={userLocationCoordinate} /> : null}
        {children}
      </Map>
      {captureDragGestures ? (
        <GestureDetector gesture={dragGesture}>
          <View style={StyleSheet.absoluteFill} />
        </GestureDetector>
      ) : null}
    </View>
  );
});
