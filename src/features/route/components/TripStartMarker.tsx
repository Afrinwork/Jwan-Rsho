import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

import { colors } from "@/src/constants/colors";
import { TripStartLocation } from "@/src/features/route/services/activeTripStorage.shared";

type TripStartMarkerProps = {
  location: TripStartLocation;
};

// The chosen start point of the trip (when it isn't the GPS position) —
// where the route line begins.
function TripStartMarkerComponent({ location }: TripStartMarkerProps) {
  return (
    <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} identifier="trip-start" title={location.label}>
      <View style={styles.pin}>
        <MaterialCommunityIcons color={colors.surface} name="flag-variant" size={20} />
      </View>
    </Marker>
  );
}

export const TripStartMarker = memo(TripStartMarkerComponent);

const styles = StyleSheet.create({
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
  },
});
