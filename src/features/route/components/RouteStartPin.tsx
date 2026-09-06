import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

import { LatLng } from "@/src/features/map/types/mapViewTypes";

type RouteStartPinProps = {
  coordinate: LatLng;
  title: string;
};

// Extracted from RouteLiveScreen.tsx (was inlined there) so that screen never
// imports anything platform-specific itself — see RouteStartPin.android.tsx
// for the MapLibre counterpart.
export function RouteStartPin({ coordinate, title }: RouteStartPinProps) {
  return (
    <Marker coordinate={coordinate} title={title}>
      <View style={styles.startPin}>
        <Text style={styles.startPinLabel}>S</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  startPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  startPinLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});
