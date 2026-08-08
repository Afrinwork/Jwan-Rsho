import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Customer } from "@/src/types/customer";
import { formatAddress } from "@/src/utils/formatAddress";

type CustomerAddressViewProps = {
  address: Pick<Customer, "street" | "houseNumber" | "postalCode" | "city" | "country" | "region">;
};

export function CustomerAddressView({ address }: CustomerAddressViewProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Text style={[styles.line, { color: colors.text }]}>
        {formatAddress([address.street, address.houseNumber])}
      </Text>
      <Text style={[styles.line, { color: colors.text }]}>
        {formatAddress([address.postalCode, address.city])}
      </Text>
      <Text style={[styles.line, { color: colors.mutedText }]}>
        {formatAddress([address.country, address.region])}
      </Text>
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
  line: {
    fontSize: 14,
  },
});
