import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { ProductTotal } from "@/src/types/productTotal";

type SelectionProductTotalsProps = {
  totals: ProductTotal[];
  loading: boolean;
};

export function SelectionProductTotals({ totals, loading }: SelectionProductTotalsProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("map");

  if (!loading && !totals.length) {
    return null;
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t("productTotals.title")}</Text>
      {loading ? <Text style={[styles.item, { color: colors.mutedText }]}>{t("productTotals.calculating")}</Text> : null}
      {!loading &&
        totals.map((value) => (
          <Text key={value.productKey} style={[styles.item, { color: colors.mutedText }]}>
            {value.productName}: {value.quantity} {value.unit}
          </Text>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: spacing.md, gap: 8 },
  title: { fontSize: 16, fontWeight: "700" },
  item: { fontSize: 14 },
});
