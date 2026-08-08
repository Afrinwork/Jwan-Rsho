import { Pressable, StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Customer } from "@/src/types/customer";
import { formatAddress } from "@/src/utils/formatAddress";

type CustomerSearchResultProps = {
  customer: Customer;
  onPress: () => void;
  selected?: boolean;
};

export function CustomerSearchResult({ customer, onPress, selected }: CustomerSearchResultProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border },
      ]}
    >
      <View style={styles.text}>
        <Text style={[styles.name, { color: colors.text }]}>{customer.fullName}</Text>
        <Text style={[styles.meta, { color: colors.mutedText }]}>
          {formatAddress([customer.phone, customer.city])}
        </Text>
      </View>
      {selected ? <Text style={{ color: colors.primary }}>✓</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
  },
  text: {
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
  },
  meta: {
    fontSize: 13,
  },
});
