import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { MapCustomerDetails } from "@/src/features/map/types/mapTypes";

type CustomerMapCardProps = {
  details: MapCustomerDetails;
};

export function CustomerMapCard({ details }: CustomerMapCardProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("map");
  const openOrders = details.openOrders;

  return (
    <>
      <Text style={[styles.name, { color: colors.text }]}>{details.customer.fullName}</Text>
      <Text style={[styles.meta, { color: colors.mutedText }]}>{details.customer.phone}</Text>
      <Text style={[styles.meta, { color: colors.mutedText }]}>
        {details.customer.address}, {details.customer.city}, {details.customer.country}
      </Text>
      {details.customer.region ? (
        <Text style={[styles.meta, { color: colors.mutedText }]}>{t("customerCard.region", { region: details.customer.region })}</Text>
      ) : null}
      {details.customer.note ? (
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("customerCard.note")}</Text>
          <Text style={[styles.noteText, { color: colors.mutedText }]}>{details.customer.note}</Text>
        </View>
      ) : null}
      {openOrders.length ? (
        openOrders.map((order, index) => (
          <View key={order.id} style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {openOrders.length > 1
                ? t("customerCard.openOrderIndexed", { index: index + 1, count: openOrders.length })
                : t("customerCard.openOrder")}
            </Text>
            <View style={styles.items}>
              {order.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={[styles.itemName, { color: colors.text }]}>{item.productNameSnapshot}</Text>
                  <Text style={[styles.itemQuantity, { color: colors.mutedText }]}>{item.quantity} {item.unit}</Text>
                </View>
              ))}
            </View>
          </View>
        ))
      ) : (
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("customerCard.openOrder")}</Text>
          <Text style={[styles.meta, { color: colors.mutedText }]}>{t("customerCard.noOpenOrderFound")}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 22, fontWeight: "700" },
  meta: { fontSize: 15, lineHeight: 22 },
  card: { borderWidth: 1, borderRadius: 16, padding: spacing.md, gap: spacing.xs },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  noteText: { fontSize: 14, lineHeight: 20 },
  items: { gap: spacing.xs },
  itemRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  itemName: { fontSize: 14, flex: 1 },
  itemQuantity: { fontSize: 14, fontWeight: "600" },
});
