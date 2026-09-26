import { Box20Regular, Location20Regular, Person20Regular } from "@fluentui/react-native-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/constants/spacing";
import { useDriverAddSuggestions } from "@/src/features/orders/hooks/useDriverAddSuggestions";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Customer } from "@/src/types/customer";

type Props = { onSelectCustomer: (customer: Customer) => void };

export function DriverAddSuggestions({ onSelectCustomer }: Props) {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const router = useRouter();
  const { error, loading, suggestions } = useDriverAddSuggestions();

  return (
    <AppCard tone="primary">
      <View style={styles.heading}>
        <Location20Regular color={colors.primary} />
        <View style={styles.headingText}>
          <AppText variant="title">{t("driverSuggestions.title")}</AppText>
          <AppText color="secondary" variant="caption">{t("driverSuggestions.subtitle")}</AppText>
        </View>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && suggestions.length === 0 ? (
        <AppText color="secondary">{t("driverSuggestions.empty")}</AppText>
      ) : null}
      {!loading && !error ? suggestions.map((suggestion) => {
        const isRouteOrder = suggestion.openOrders.length > 0;
        const firstOrder = suggestion.openOrders[0];
        const Icon = isRouteOrder ? Box20Regular : Person20Regular;
        return (
          <Pressable
            accessibilityRole="button"
            key={suggestion.customer.id}
            onPress={() => isRouteOrder
              ? router.push(`/order/${firstOrder.id}`)
              : onSelectCustomer(suggestion.customer)}
            style={({ pressed }) => [
              styles.suggestion,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: pressed ? 0.78 : 1 },
            ]}
          >
            <Icon color={colors.primary} />
            <View style={styles.suggestionText}>
              <AppText numberOfLines={1} variant="bodyMedium">{suggestion.customer.fullName}</AppText>
              <AppText color="secondary" numberOfLines={1} variant="caption">
                {isRouteOrder
                  ? t("driverSuggestions.routeOrder", { count: suggestion.openOrders.length })
                  : t("driverSuggestions.nearbyCustomer")}
                {suggestion.distanceKm === null
                  ? ""
                  : ` · ${t("driverSuggestions.distance", { distance: suggestion.distanceKm.toFixed(1) })}`}
              </AppText>
            </View>
            <AppText color="primary" variant="caption">
              {t(isRouteOrder ? "driverSuggestions.open" : "driverSuggestions.select")}
            </AppText>
          </Pressable>
        );
      }) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  heading: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  headingText: { flex: 1, gap: 2 },
  suggestion: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  suggestionText: { flex: 1 },
});
