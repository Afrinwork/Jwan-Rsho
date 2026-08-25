import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Flash20Regular, People20Regular } from "@fluentui/react-native-icons";

import { AppBadge } from "@/src/components/ui/AppBadge";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/constants/spacing";
import { CitySummary } from "@/src/features/cities/types/cityTypes";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type CityCardProps = {
  city: CitySummary;
};

export function CityCard({ city }: CityCardProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useTranslation("cities");

  return (
    <Pressable onPress={() => router.push(`/city/${city.normalizedName}`)} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.992 : 1 }] }]}>
      <AppCard contentStyle={styles.card} style={{ shadowColor: colors.shadow }}>
        <View style={styles.topRow}>
          <View style={styles.copy}>
            <AppText style={styles.title}>{city.name}</AppText>
            <AppText color="muted" style={styles.meta}>{city.country}</AppText>
          </View>
          <AppBadge label={String(city.openOrderCount)} tone={city.openOrderCount ? "primary" : "neutral"} />
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.metric}>
            <People20Regular color={colors.primary} />
            <AppText style={styles.metricText} variant="caption">{t("card.customers", { count: city.customerCount })}</AppText>
          </View>
          <View style={styles.metric}>
            <Flash20Regular color={colors.primary} />
            <AppText style={styles.metricText} variant="caption">{t("card.openOrders", { count: city.openOrderCount })}</AppText>
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  meta: {
    fontSize: 14,
  },
  bottomRow: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
