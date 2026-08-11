import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Flash20Regular, People20Regular } from "@fluentui/react-native-icons";

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
      <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, shadowColor: colors.shadow }]}>
        <View style={styles.topRow}>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: colors.text }]}>{city.name}</Text>
            <Text style={[styles.meta, { color: colors.mutedText }]}>{city.country}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: city.openOrderCount ? colors.primaryMuted : colors.surfaceMuted }]}>
            <Text style={[styles.badgeValue, { color: city.openOrderCount ? colors.primary : colors.mutedText }]}>{city.openOrderCount}</Text>
          </View>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.metric}>
            <People20Regular color={colors.primary} />
            <Text style={[styles.metricText, { color: colors.text }]}>{t("card.customers", { count: city.customerCount })}</Text>
          </View>
          <View style={styles.metric}>
            <Flash20Regular color={colors.primary} />
            <Text style={[styles.metricText, { color: colors.text }]}>{t("card.openOrders", { count: city.openOrderCount })}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  badge: {
    minWidth: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  meta: {
    fontSize: 14,
  },
  badgeValue: {
    fontSize: 22,
    fontWeight: "800",
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
