import { StyleSheet, View } from "react-native";
import { Marker } from "@maplibre/maplibre-react-native";

import { LatLng } from "@/src/features/map/types/mapViewTypes";

type UserLocationDotProps = {
  coordinate: LatLng;
};

// Stands in for MapLibre's built-in <UserLocation> component, which has a
// known bug under React Native's New Architecture on Android (the blue-dot
// position doesn't update) — see AppMapView.android.tsx for context. This
// app already tracks the device's own position independently (useUserLocation
// / useLiveLocation, built on expo-location), so it's simplest to just render
// that as an ordinary marker, the same pattern as every other pin on this map.
export function UserLocationDot({ coordinate }: UserLocationDotProps) {
  return (
    <Marker lngLat={[coordinate.longitude, coordinate.latitude]}>
      <View style={styles.outer}>
        <View style={styles.dot} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(37, 99, 235, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2563EB",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});
