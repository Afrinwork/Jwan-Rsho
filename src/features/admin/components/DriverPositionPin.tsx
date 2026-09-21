import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

import { LatLng } from "@/src/features/map/types/mapViewTypes";

type DriverPositionPinProps = {
  coordinate: LatLng;
  title: string;
};

// The driver's own last-reported position on the read-only admin "driver
// view" map -- a truck glyph so it's never mistaken for a numbered customer
// stop, and a distinct blue so it reads as "this is the driver", not "this
// is a place to go". See DriverPositionPin.android.tsx for the MapLibre port.
export function DriverPositionPin({ coordinate, title }: DriverPositionPinProps) {
  return (
    <Marker coordinate={coordinate} title={title}>
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
