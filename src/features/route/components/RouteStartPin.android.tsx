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
export function RouteStartPin({ coordinate }: RouteStartPinProps) {
  return (
    <Marker lngLat={[coordinate.longitude, coordinate.latitude]}>
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
