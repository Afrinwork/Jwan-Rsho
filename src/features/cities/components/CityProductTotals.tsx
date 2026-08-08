import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/constants/colors";
import { spacing } from "@/src/constants/spacing";

import { CityProductTotal } from "@/src/features/cities/types/cityProductTotalTypes";

type CityProductTotalsProps = {
  totals: CityProductTotal[];
};

export function CityProductTotals({ totals }: CityProductTotalsProps) {
  if (!totals.length) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Produktsummen offen</Text>
      {totals.map((value) => (
        <Text key={value.productKey} style={styles.item}>
          {value.productName}: {value.quantity} {value.unit}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: spacing.md, gap: 8 },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  item: { color: colors.mutedText, fontSize: 14 },
});
