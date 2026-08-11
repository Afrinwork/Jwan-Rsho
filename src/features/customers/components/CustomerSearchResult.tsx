import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("customers");

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border },
        selected ? styles.selectedRow : null,
      ]}
    >
      <View style={styles.text}>
        <Text style={[styles.name, { color: colors.text }]}>{customer.fullName}</Text>
        <Text style={[styles.meta, { color: colors.mutedText }]}>
          {formatAddress([customer.phone, customer.city])}
        </Text>
        <Text numberOfLines={1} style={[styles.address, { color: colors.mutedText }]}>
          {customer.address}
        </Text>
      </View>
      {selected ? <Text style={[styles.selectedLabel, { color: colors.primary }]}>Ausgewaehlt</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.sm,
  },
  selectedRow: {
    borderWidth: 1.5,
  },
  text: {
    gap: 3,
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    fontSize: 13,
  },
  address: {
    fontSize: 12,
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
});
