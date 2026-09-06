import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "@maplibre/maplibre-react-native";

import { colors } from "@/src/constants/colors";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";

type CustomerMarkerProps = {
  marker: MapCustomerMarker;
  selected: boolean;
  onPress: () => void;
};

// Fixed hex values (not theme tokens) — these mark a specific data state on
// the map, not app chrome, so they must stay the same in light and dark mode.
const PIN_TEAL = "#0D9488";
const PIN_YELLOW = "#EAB308";
const PIN_SELECTED_GRAY = "#6B7280";

// MapLibre port of CustomerMarker.tsx — same pin visuals, same "no native
// Callout" reasoning (see that file), only the host element differs
// (react-native-maps' <Marker coordinate> -> MapLibre's <Marker lngLat>).
function CustomerMarkerComponent({ marker, selected, onPress }: CustomerMarkerProps) {
  const backgroundColor = selected ? PIN_SELECTED_GRAY : marker.hasStreetAddress === false ? PIN_YELLOW : PIN_TEAL;

  return (
    <Marker id={marker.id} lngLat={[marker.longitude, marker.latitude]} onPress={onPress}>
      <View style={[styles.pin, { backgroundColor }, selected && styles.pinSelected]}>
        <Text style={styles.label}>{marker.numberLabel}</Text>
      </View>
    </Marker>
  );
}

export const CustomerMarker = memo(CustomerMarkerComponent);

const styles = StyleSheet.create({
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pinSelected: {
    transform: [{ scale: 1.15 }],
  },
  label: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
});
