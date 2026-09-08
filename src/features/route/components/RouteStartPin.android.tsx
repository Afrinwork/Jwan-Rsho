import { StyleSheet, Text, View } from "react-native";
import { Marker } from "@maplibre/maplibre-react-native";

import { LatLng } from "@/src/features/map/types/mapViewTypes";

type RouteStartPinProps = {
  coordinate: LatLng;
  title: string;
};

// MapLibre port of RouteStartPin.tsx — same visuals, only the host element
// differs. `title` isn't rendered (MapLibre's Marker has no title/tooltip
// prop, same as the original inline react-native-maps version never showed
// one either — it was only ever used for accessibility metadata).
// A flag glyph (not a letter or number) so this pin can never be mistaken for
// a numbered stop that "lost" its number, even when it sits at/near stop 1's
// coordinates — bigger than the 34px stop pins for the same reason.
export function RouteStartPin({ coordinate }: RouteStartPinProps) {
  return (
    <Marker lngLat={[coordinate.longitude, coordinate.latitude]}>
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
