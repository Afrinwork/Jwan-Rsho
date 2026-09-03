import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Callout } from "react-native-maps";

import { colors } from "@/src/constants/colors";
import { mapT } from "@/src/features/map/i18n/mapT";
import { OrderItem } from "@/src/types/orderItem";

type CustomerOrderCalloutProps = {
  title: string;
  items: OrderItem[] | null;
  loading: boolean;
  error: boolean;
};

// Shared callout content for CustomerMarker (map screen) and RouteStopMarker
// (live route screen) — shows the customer's ordered products, not the
// address, which is deliberately kept out of this quick pin preview.
export function CustomerOrderCallout({ title, items, loading, error }: CustomerOrderCalloutProps) {
  return (
    <Callout tooltip={false}>
      <View style={styles.callout}>
        <Text style={styles.title}>{title}</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.spinner} />
        ) : error ? (
          <Text style={styles.line}>{mapT("markerCallout.loadError")}</Text>
        ) : items && items.length ? (
          items.map((item) => (
            <Text key={item.id} style={styles.line}>
              {`- ${item.productNameSnapshot}: ${item.quantity} ${item.unit}`}
            </Text>
          ))
        ) : (
          <Text style={styles.line}>{mapT("markerCallout.noOpenOrder")}</Text>
        )}
      </View>
    </Callout>
  );
}

const styles = StyleSheet.create({
  callout: {
    minWidth: 180,
    maxWidth: 260,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  line: {
    fontSize: 13,
    color: colors.text,
  },
  spinner: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
});
