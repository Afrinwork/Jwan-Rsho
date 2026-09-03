import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

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

// No native Callout here on purpose — tapping already opens the full detail
// sheet (MapCustomerSheet, via onPress -> selectedCustomerId in MapScreen),
// which has everything the callout would (and more: address, note, edit/
// complete actions). A second, separate popup on top of that was redundant
// and, on top of the camera-follow interaction on the live screen, flaky.
function CustomerMarkerComponent({ marker, selected, onPress }: CustomerMarkerProps) {
  const backgroundColor = selected ? PIN_SELECTED_GRAY : marker.hasStreetAddress === false ? PIN_YELLOW : PIN_TEAL;

  return (
    <Marker
      coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
      identifier={marker.id}
      onPress={onPress}
      title={marker.title}
    >
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
