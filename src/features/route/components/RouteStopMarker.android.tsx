import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "@maplibre/maplibre-react-native";

import { colors } from "@/src/constants/colors";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";

type RouteStopMarkerProps = {
  marker: MapCustomerMarker;
  // Route-sequence number ("1st stop", "2nd stop", ...) — deliberately NOT
  // marker.numberLabel, which is an unrelated alphabetical index across all
  // customers and would show the wrong number on the route map.
  label: string;
  active: boolean;
  // Already completed/skipped — stays on the map (never removed), just
  // rendered muted so it visually recedes behind the upcoming stops.
  inactive?: boolean;
  onPress: (customerId: string) => void;
};

// MapLibre port of RouteStopMarker.tsx — same pin visuals and "no native
// Callout" reasoning (see that file), only the host element differs.
function RouteStopMarkerComponent({ marker, label, active, inactive, onPress }: RouteStopMarkerProps) {
  return (
    <Marker id={marker.id} lngLat={[marker.longitude, marker.latitude]} onPress={() => onPress(marker.id)}>
      <View style={[styles.pin, inactive && styles.pinInactive, active && styles.pinActive]}>
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
  pinInactive: {
    backgroundColor: "#6B7280",
    opacity: 0.6,
  },
  label: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
});
