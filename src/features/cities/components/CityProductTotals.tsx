import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

import { CityProductTotal } from "@/src/features/cities/types/cityProductTotalTypes";

type CityProductTotalsProps = {
  totals: CityProductTotal[];
};

export function CityProductTotals({ totals }: CityProductTotalsProps) {
  const { t } = useTranslation("cities");
  const colors = useThemeColors();

  if (!totals.length) {
    return null;
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
        },
      ]}
    >
      <AppText style={styles.title} variant="caption">
        {t("productTotals.title")}
      </AppText>
      <View style={styles.items}>
        {totals.map((value) => (
          <View
            key={value.productKey}
            style={[
              styles.itemChip,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <AppText color="muted" style={styles.itemText} variant="caption">
              {value.productName}: {value.quantity} {value.unit}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  title: {
    fontWeight: "700",
  },
  items: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  itemChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  itemText: {},
});
