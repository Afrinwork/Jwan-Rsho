import {
  ArrowRight20Regular,
  Box20Regular,
  CheckmarkCircle20Regular,
  Map20Regular,
  People20Regular,
} from "@fluentui/react-native-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { I18nManager, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { routes } from "@/src/constants/routes";
import { CompletedTodaySection } from "@/src/features/overview/components/CompletedTodaySection";
import { OverviewStatCard } from "@/src/features/overview/components/OverviewStatCard";
import { useOverviewStats } from "@/src/features/overview/hooks/useOverviewStats";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

export function OverviewScreen() {
  const { t } = useTranslation("overview");
  const router = useRouter();
  const colors = useThemeColors();
  const { stats, loading, error } = useOverviewStats();

  if (loading) {
    return <LoadingView label={t("screen.loading")} />;
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <CompactScreenHeader subtitle={t("screen.subtitle")} title={t("screen.title")} />
      {error ? <ErrorState message={error} /> : null}

      <AppCard contentStyle={styles.heroContent} style={styles.hero}>
        <View style={styles.heroTopLine}>
          <View style={styles.liveLabel}>
            <View style={styles.liveDot} />
            <AppText color="#FFFFFF" variant="label">{t("screen.live")}</AppText>
          </View>
          <Map20Regular color="#FFFFFF" />
        </View>
        <View style={styles.heroCopy}>
          <AppText color="#FFFFFF" variant="heading">{t("screen.heroTitle")}</AppText>
          <AppText color="#FFFFFF" style={styles.heroValue} variant="display">{String(stats.openOrders)}</AppText>
          <AppText color="#D6D6D6" variant="body">{t("screen.heroOpenOrders")}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/orders/open")}
          style={({ pressed }) => [styles.heroAction, { opacity: pressed ? 0.78 : 1 }]}
        >
          <AppText color="#FFFFFF" variant="label">{t("screen.heroAction")}</AppText>
          <ArrowRight20Regular color="#FFFFFF" style={I18nManager.isRTL ? styles.arrowRtl : undefined} />
        </Pressable>
      </AppCard>

      <View style={styles.sectionHeader}>
        <AppText variant="subheading">{t("sections.today")}</AppText>
        <AppText color="muted" variant="caption">{t("sections.todayCaption")}</AppText>
      </View>
      <View style={styles.statGrid}>
        <OverviewStatCard
          accent="danger"
          caption={t("stats.openOrders.caption")}
          icon={Box20Regular}
          onPress={() => router.push("/orders/open")}
          title={t("stats.openOrders.title")}
          value={String(stats.openOrders)}
        />
        <OverviewStatCard
          caption={t("stats.openOrderCustomers.caption")}
          icon={People20Regular}
          onPress={() => router.push("/orders/open")}
          title={t("stats.openOrderCustomers.title")}
          value={String(stats.openOrderCustomers)}
        />
        <OverviewStatCard
          accent="success"
          caption={t("stats.completedOrders.caption")}
          icon={CheckmarkCircle20Regular}
          title={t("stats.completedOrders.title")}
          value={String(stats.completedOrders)}
        />
        <OverviewStatCard
          caption={t("stats.drivers.caption")}
          icon={People20Regular}
          onPress={() => router.push(routes.managementDrivers)}
          title={t("stats.drivers.title")}
          value={String(stats.drivers)}
        />
      </View>

      <AppCard contentStyle={styles.workspaceCard}>
        <View style={styles.workspaceHeader}>
          <AppText variant="subheading">{t("sections.workspace")}</AppText>
          <Pressable accessibilityRole="button" onPress={() => router.push(routes.management)}>
            <AppText color="primary" variant="label">{t("sections.workspaceAction")}</AppText>
          </Pressable>
        </View>
        <View style={[styles.workspaceRow, { borderTopColor: colors.border }]}>
          <WorkspaceMetric label={t("stats.customers.title")} value={stats.customers} />
          <WorkspaceMetric label={t("stats.products.title")} value={stats.products} />
          <WorkspaceMetric label={t("stats.cities.title")} value={stats.cities} />
          <WorkspaceMetric label={t("stats.countries.title")} value={stats.countries} />
        </View>
      </AppCard>

      <CompletedTodaySection />
    </ScrollView>
  );
}

function WorkspaceMetric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.workspaceMetric}>
      <AppText style={styles.workspaceValue} variant="heading">{String(value)}</AppText>
      <AppText color="muted" numberOfLines={2} style={styles.workspaceLabel} variant="caption">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: 112,
  },
  hero: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },
  heroContent: {
    minHeight: 232,
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  heroTopLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  liveLabel: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  liveDot: {
    backgroundColor: "#62D99B",
    borderRadius: radius.pill,
    height: 8,
    width: 8,
  },
  heroCopy: {
    gap: spacing.xs,
  },
  heroValue: {
    fontSize: 58,
    lineHeight: 64,
  },
  heroAction: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.20)",
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  arrowRtl: {
    transform: [{ scaleX: -1 }],
  },
  sectionHeader: {
    gap: 2,
    marginTop: spacing.xs,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  workspaceCard: {
    gap: spacing.md,
  },
  workspaceHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  workspaceRow: {
    borderTopWidth: 1,
    flexDirection: "row",
    paddingTop: spacing.md,
  },
  workspaceMetric: {
    flex: 1,
    gap: spacing.xxs,
  },
  workspaceValue: {
    textAlign: "center",
  },
  workspaceLabel: {
    textAlign: "center",
  },
});
