import { useTranslation } from "react-i18next";

import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { AdminActions } from "@/src/features/admin/components/AdminActions";
import { AdminSectionHeader } from "@/src/features/admin/components/AdminSectionHeader";
import { AdminStatsGrid } from "@/src/features/admin/components/AdminStatsGrid";
import { useAdminDashboard } from "@/src/features/admin/hooks/useAdminDashboard";

export function AdminDashboardScreen() {
  const { stats, loading, error } = useAdminDashboard();
  const { t } = useTranslation("admin");

  if (loading) {
    return <LoadingView label={t("dashboard.loading")} />;
  }

  return (
    <ScreenContainer>
      <AdminSectionHeader subtitle={t("dashboard.subtitle")} title={t("dashboard.title")} />
      {error ? <ErrorState message={error} /> : null}
      <AdminStatsGrid stats={stats} />
      <AdminActions />
    </ScreenContainer>
  );
}
