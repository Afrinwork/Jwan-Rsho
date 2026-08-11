import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { colors } from "@/src/constants/colors";
import { spacing } from "@/src/constants/spacing";
import { OrderWithItems } from "@/src/types/order";

type CustomerOrderCardProps = {
  order: OrderWithItems;
};

export function CustomerOrderCard({ order }: CustomerOrderCardProps) {
  const { t } = useTranslation("customers");

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{labelForStatus(order.status, t)}</Text>
      <Text style={styles.meta}>{new Date(order.orderedAt).toLocaleDateString()}</Text>
      {order.items.map((item) => (
        <Text key={item.id} style={styles.meta}>
          {item.productNameSnapshot}: {item.quantity} {item.unit}
        </Text>
      ))}
    </View>
  );
}

function labelForStatus(status: OrderWithItems["status"], t: ReturnType<typeof useTranslation>["t"]) {
  if (status === "open") {
    return t("orderStatus.open");
  }

  if (status === "completed") {
    return t("orderStatus.completed");
  }

  return t("orderStatus.cancelled");
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: spacing.md, gap: 6 },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  meta: { color: colors.mutedText, fontSize: 14 },
});
