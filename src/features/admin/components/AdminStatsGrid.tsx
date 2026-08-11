import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { InfoCard } from "@/src/components/ui/InfoCard";
import { AdminDashboardStats } from "@/src/types/admin";

type AdminStatsGridProps = {
  stats: AdminDashboardStats;
};

export function AdminStatsGrid({ stats }: AdminStatsGridProps) {
  const { t } = useTranslation("admin");

  return (
    <View style={styles.grid}>
      <InfoCard label={t("stats.activeUsers")} value={stats.activeUsers} />
      <InfoCard label={t("stats.ownCustomers")} value={stats.ownCustomers} />
      <InfoCard label={t("stats.ownOpenOrders")} value={stats.ownOpenOrders} />
      <InfoCard label={t("stats.ownTotalOrders")} value={stats.ownTotalOrders} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
  },
});
