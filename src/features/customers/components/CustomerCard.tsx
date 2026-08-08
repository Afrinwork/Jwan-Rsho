import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Customer } from "@/src/types/customer";

type CustomerCardProps = {
  customer: Pick<Customer, "fullName" | "phone" | "note">;
};

export function CustomerCard({ customer }: CustomerCardProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Text style={[styles.name, { color: colors.text }]}>{customer.fullName}</Text>
      <Text style={[styles.phone, { color: colors.mutedText }]}>{customer.phone}</Text>
      {customer.note ? <Text style={[styles.note, { color: colors.mutedText }]}>{customer.note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    gap: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
  },
  phone: {
    fontSize: 15,
  },
  note: {
    fontSize: 13,
    fontStyle: "italic",
  },
});
