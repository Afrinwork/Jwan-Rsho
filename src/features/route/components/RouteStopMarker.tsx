import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

import { colors } from "@/src/constants/colors";
import { CustomerOrderCallout } from "@/src/features/map/components/CustomerOrderCallout";
import { useLazyOrderItems } from "@/src/features/map/hooks/useLazyOrderItems";
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
  const order = useLazyOrderItems(marker.id);

  return (
    <Marker
      coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
      identifier={marker.id}
      onPress={order.load}
      title={marker.title}
    >
      <View style={[styles.pin, active && styles.pinActive]}>
        <Text style={styles.label}>{label}</Text>
      </View>
      <CustomerOrderCallout error={order.error} items={order.items} loading={order.loading} title={marker.title} />
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
