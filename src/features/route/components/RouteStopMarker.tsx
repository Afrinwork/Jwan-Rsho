import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

import { colors } from "@/src/constants/colors";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";

type RouteStopMarkerProps = {
  marker: MapCustomerMarker;
  // Route-sequence number ("1st stop", "2nd stop", ...) — deliberately NOT
  // marker.numberLabel, which is an unrelated alphabetical index across all
  // customers and would show the wrong number on the route map.
  label: string;
  active: boolean;
};

function RouteStopMarkerComponent({ marker, label, active }: RouteStopMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
      description={marker.description}
      identifier={marker.id}
      title={marker.title}
    >
      <View style={[styles.pin, active && styles.pinActive]}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Marker>
  );
}

export const RouteStopMarker = memo(RouteStopMarkerComponent);

const styles = StyleSheet.create({
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pinActive: {
    backgroundColor: colors.danger,
    borderColor: colors.dangerBorder,
    transform: [{ scale: 1.15 }],
  },
  label: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
});
