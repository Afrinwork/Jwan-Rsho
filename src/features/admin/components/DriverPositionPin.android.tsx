import { StyleSheet, Text, View } from "react-native";
import { Marker } from "@maplibre/maplibre-react-native";

import { LatLng } from "@/src/features/map/types/mapViewTypes";

type DriverPositionPinProps = {
  coordinate: LatLng;
  title: string;
};

// MapLibre port of DriverPositionPin.tsx -- same visuals, only the host
// element differs (title isn't rendered, same as RouteStartPin.android.tsx).
export function DriverPositionPin({ coordinate }: DriverPositionPinProps) {
  return (
    <Marker lngLat={[coordinate.longitude, coordinate.latitude]}>
      <View style={styles.pin}>
        <Text style={styles.label}>🚚</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 18 },
});
