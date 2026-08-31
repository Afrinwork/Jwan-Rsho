import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SearchInput } from "@/src/components/ui/SearchInput";
import { spacing } from "@/src/constants/spacing";
import { routes } from "@/src/constants/routes";
import { ManagementCustomerCard } from "@/src/features/management/components/ManagementCustomerCard";
import { useManagementCustomers } from "@/src/features/management/hooks/useManagementCustomers";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";

export function CustomerManagementScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useTranslation("management");
  const { customers, error, loading, query, setQuery, totalCount } = useManagementCustomers();

  if (loading) {
    return <LoadingView label={t("customersScreen.loading")} />;
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AnimatedEntrance>
          <CompactScreenHeader
            subtitle={t("customersScreen.subtitle")}
            title={t("customersScreen.title")}
            chips={
              <AppCard
                contentStyle={styles.countChip}
                style={[styles.countFrame, { backgroundColor: "#F8E0CF", borderColor: colors.primaryStrong, shadowColor: colors.primary }]}
              >
                <AppText color="primary" variant="label">
                  {totalCount}
                </AppText>
                <AppText color="muted" variant="caption">
                  {t("customersScreen.count")}
                </AppText>
              </AppCard>
            }
          />
        </AnimatedEntrance>
        <AnimatedEntrance delay={40}>
          <View style={styles.searchWrap}>
            <SearchInput onChangeText={setQuery} value={query} />
          </View>
        </AnimatedEntrance>
        {error ? (
          <AnimatedEntrance delay={70}>
            <ErrorState message={error} />
          </AnimatedEntrance>
        ) : null}
        {!customers.length ? (
          <AnimatedEntrance delay={90}>
            <EmptyState message={t("customersScreen.emptyMessage")} title={t("customersScreen.emptyTitle")} />
          </AnimatedEntrance>
        ) : (
          <AnimatedEntrance delay={100} style={styles.list}>
            {customers.map((customer) => (
              <ManagementCustomerCard
                customer={customer}
                key={customer.id}
                onPress={() => router.push(`${routes.customerEditBase}/${customer.id}` as never)}
              />
            ))}
          </AnimatedEntrance>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  countFrame: {
    borderRadius: radius.pill,
    padding: 2,
    borderWidth: 1,
  },
  countChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  searchWrap: {
    marginTop: -spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
});
