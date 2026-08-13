import {
  Board20Regular,
  Box20Regular,
  Building20Regular,
  CheckmarkCircle20Regular,
  City20Regular,
  ClipboardTask20Regular,
} from "@fluentui/react-native-icons";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { spacing } from "@/src/theme/spacing";
import { OverviewHeroCard } from "@/src/features/overview/components/OverviewHeroCard";
import { OverviewStatCard } from "@/src/features/overview/components/OverviewStatCard";
import { useOverviewStats } from "@/src/features/overview/hooks/useOverviewStats";

export function OverviewScreen() {
  const { t } = useTranslation("overview");
  const { stats, loading, error } = useOverviewStats();
  const motivation = getMotivation(t, stats.openOrders, stats.completedOrders);

  if (loading) {
    return <LoadingView label={t("screen.loading")} />;
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AnimatedEntrance>
          <CompactScreenHeader subtitle={t("screen.subtitle")} title={t("screen.title")} />
        </AnimatedEntrance>
        <AnimatedEntrance delay={50}>
          <OverviewHeroCard
            subtitle={motivation}
            title={t("screen.heroTitle")}
            value={String(stats.openOrders)}
          />
        </AnimatedEntrance>
        <AnimatedEntrance delay={70}>
          <AppCard contentStyle={styles.messageCard} frosted>
            <AppText variant="subheading">{t("screen.messageTitle")}</AppText>
            <AppText color="muted" variant="body">
              {buildProgressText(t, stats.openOrders, stats.completedOrders)}
            </AppText>
          </AppCard>
        </AnimatedEntrance>
        {error ? <AnimatedEntrance delay={80}><ErrorState message={error} /></AnimatedEntrance> : null}
        <AnimatedEntrance delay={100} style={styles.grid}>
          <OverviewStatCard accent="danger" caption={t("stats.openOrders.caption")} icon={ClipboardTask20Regular} title={t("stats.openOrders.title")} value={String(stats.openOrders)} />
          <OverviewStatCard accent="success" caption={t("stats.completedOrders.caption")} icon={CheckmarkCircle20Regular} title={t("stats.completedOrders.title")} value={String(stats.completedOrders)} />
          <OverviewStatCard caption={t("stats.countries.caption")} icon={Building20Regular} title={t("stats.countries.title")} value={String(stats.countries)} />
          <OverviewStatCard caption={t("stats.cities.caption")} icon={City20Regular} title={t("stats.cities.title")} value={String(stats.cities)} />
          <OverviewStatCard caption={t("stats.products.caption")} icon={Box20Regular} title={t("stats.products.title")} value={String(stats.products)} />
          <OverviewStatCard caption={t("stats.customers.caption")} icon={Board20Regular} title={t("stats.customers.title")} value={String(stats.customers)} />
        </AnimatedEntrance>
      </ScrollView>
    </ScreenContainer>
  );
}

function getMotivation(t: ReturnType<typeof useTranslation>["t"], openOrders: number, completedOrders: number) {
  if (openOrders === 0) {
    return t("motivation.none");
  }

  if (openOrders === 1) {
    return t("motivation.one");
  }

  if (completedOrders > openOrders) {
    return t("motivation.aheadOfSchedule", { openOrders });
  }

  return t("motivation.inProgress", { openOrders });
}

function buildProgressText(t: ReturnType<typeof useTranslation>["t"], openOrders: number, completedOrders: number) {
  if (openOrders === 0 && completedOrders === 0) {
    return t("progress.empty");
  }

  if (openOrders === 0) {
    return t("progress.allDone", { completedOrders });
  }

  return t("progress.inProgress", { completedOrders, openOrders });
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  messageCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
});
