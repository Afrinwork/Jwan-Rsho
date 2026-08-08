import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/constants/colors";
import { spacing } from "@/src/constants/spacing";
import { OrderWithItems } from "@/src/types/order";

type CustomerOrderCardProps = {
  order: OrderWithItems;
};

export function CustomerOrderCard({ order }: CustomerOrderCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{labelForStatus(order.status)}</Text>
      <Text style={styles.meta}>{new Date(order.orderedAt).toLocaleDateString()}</Text>
      {order.items.map((item) => (
        <Text key={item.id} style={styles.meta}>
          {item.productNameSnapshot}: {item.quantity} {item.unit}
        </Text>
      ))}
    </View>
  );
}

function labelForStatus(status: OrderWithItems["status"]) {
  if (status === "open") {
    return "Offene Bestellung";
  }

  if (status === "completed") {
    return "Erledigte Bestellung";
  }

  return "Stornierte Bestellung";
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: spacing.md, gap: 6 },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  meta: { color: colors.mutedText, fontSize: 14 },
});
