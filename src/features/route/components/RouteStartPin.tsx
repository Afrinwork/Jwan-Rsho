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
// A flag glyph (not a letter or number) so this pin can never be mistaken for
// a numbered stop that "lost" its number, even when it sits at/near stop 1's
// coordinates — bigger than the 34px stop pins for the same reason.
export function RouteStartPin({ coordinate, title }: RouteStartPinProps) {
  return (
    <Marker coordinate={coordinate} title={title}>
      <View style={styles.startPin}>
        <Text style={styles.startPinLabel}>🏁</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  startPin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  startPinLabel: { fontSize: 18 },
});
