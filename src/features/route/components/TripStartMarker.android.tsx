import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "@maplibre/maplibre-react-native";

import { colors } from "@/src/constants/colors";
import { TripStartLocation } from "@/src/features/route/services/activeTripStorage.shared";

type TripStartMarkerProps = {
  location: TripStartLocation;
};

// MapLibre port of TripStartMarker.tsx — same pin, only the host element differs.
function TripStartMarkerComponent({ location }: TripStartMarkerProps) {
  return (
    <Marker id="trip-start" lngLat={[location.longitude, location.latitude]}>
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
