import { StyleSheet, View } from "react-native";

import { InfoCard } from "@/src/components/ui/InfoCard";
import { AdminDashboardStats } from "@/src/types/admin";

type AdminStatsGridProps = {
  stats: AdminDashboardStats;
};

export function AdminStatsGrid({ stats }: AdminStatsGridProps) {
  return (
    <View style={styles.grid}>
      <InfoCard label="Aktive Benutzer" value={stats.activeUsers} />
      <InfoCard label="Eigene Kunden" value={stats.ownCustomers} />
      <InfoCard label="Offene Bestellungen" value={stats.ownOpenOrders} />
      <InfoCard label="Gesamtbestellungen" value={stats.ownTotalOrders} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
  },
});
