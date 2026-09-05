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
  // Already completed/skipped — stays on the map (never removed), just
  // rendered muted so it visually recedes behind the upcoming stops.
  inactive?: boolean;
  onPress: (customerId: string) => void;
};

// No native Callout here on purpose — same reasoning as CustomerMarker (map
// screen): tapping opens the full detail sheet instead, which has everything
// a callout would (and more: address, note, edit/complete/skip actions). A
// native Callout was flaky here specifically, since the live screen's
// camera-follow re-animates the map on every GPS tick, and animating the map
// is what dismisses an open Callout on both iOS and Android — it kept
// closing itself right after being tapped open.
function RouteStopMarkerComponent({ marker, label, active, inactive, onPress }: RouteStopMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
      identifier={marker.id}
      onPress={() => onPress(marker.id)}
      title={marker.title}
    >
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
