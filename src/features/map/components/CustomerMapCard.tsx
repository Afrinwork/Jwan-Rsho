import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { MapCustomerDetails } from "@/src/features/map/types/mapTypes";

type CustomerMapCardProps = {
  details: MapCustomerDetails;
};

export function CustomerMapCard({ details }: CustomerMapCardProps) {
  const colors = useThemeColors();

  return (
    <>
      <Text style={[styles.name, { color: colors.text }]}>{details.customer.fullName}</Text>
      <Text style={[styles.meta, { color: colors.mutedText }]}>{details.customer.phone}</Text>
      <Text style={[styles.meta, { color: colors.mutedText }]}>
        {details.customer.street} {details.customer.houseNumber}, {details.customer.postalCode} {details.customer.city}, {details.customer.country}
      </Text>
      {details.customer.region ? <Text style={[styles.meta, { color: colors.mutedText }]}>Region: {details.customer.region}</Text> : null}
      {details.customer.note ? (
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notiz</Text>
          <Text style={[styles.noteText, { color: colors.mutedText }]}>{details.customer.note}</Text>
        </View>
      ) : null}
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Offene Bestellung</Text>
        {details.openOrder ? (
          <View style={styles.items}>
            {details.openOrder.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.productNameSnapshot}</Text>
                <Text style={[styles.itemQuantity, { color: colors.mutedText }]}>{item.quantity} {item.unit}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.meta, { color: colors.mutedText }]}>Keine offene Bestellung gefunden.</Text>
        )}
      </View>
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
