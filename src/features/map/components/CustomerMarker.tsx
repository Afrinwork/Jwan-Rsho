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

function CustomerMarkerComponent({ marker, selected, onPress }: CustomerMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
      description={marker.description}
      identifier={marker.id}
      onPress={onPress}
      title={marker.title}
    >
      <View style={[styles.pin, selected && styles.pinSelected]}>
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
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pinSelected: {
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
