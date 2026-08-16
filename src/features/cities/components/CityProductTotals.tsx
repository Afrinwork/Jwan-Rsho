import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

import { CityProductTotal } from "@/src/features/cities/types/cityProductTotalTypes";

type CityProductTotalsProps = {
  totals: CityProductTotal[];
  embedded?: boolean;
  inverted?: boolean;
};

export function CityProductTotals({ totals, embedded = false, inverted = false }: CityProductTotalsProps) {
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
          backgroundColor: embedded ? "rgba(255, 255, 255, 0.04)" : colors.surfaceMuted,
          borderColor: embedded ? "rgba(255, 255, 255, 0.08)" : colors.border,
        },
      ]}
    >
      <AppText color={inverted ? "#F8FAFC" : "default"} style={styles.title} variant="caption">
        {t("productTotals.title")}
      </AppText>
      <View style={styles.items}>
        {totals.map((value) => (
          <View
            key={value.productKey}
            style={[
              styles.itemChip,
              {
                backgroundColor: embedded ? "rgba(255, 255, 255, 0.08)" : colors.surface,
                borderColor: embedded ? "rgba(255, 255, 255, 0.12)" : colors.border,
              },
            ]}
          >
            <AppText color={inverted ? "#E2E8F0" : "muted"} style={styles.itemText} variant="caption">
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
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
    paddingVertical: 7,
  },
  itemText: {},
});
