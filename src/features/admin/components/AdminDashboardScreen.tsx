import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { AdminActions } from "@/src/features/admin/components/AdminActions";
import { AdminSectionHeader } from "@/src/features/admin/components/AdminSectionHeader";
import { AdminStatsGrid } from "@/src/features/admin/components/AdminStatsGrid";
import { useAdminDashboard } from "@/src/features/admin/hooks/useAdminDashboard";

export function AdminDashboardScreen() {
  const { stats, loading, error } = useAdminDashboard();

  if (loading) {
    return <LoadingView label="Admin-Dashboard laedt..." />;
  }

  return (
    <ScreenContainer>
      <AdminSectionHeader subtitle="Kleine Admin-Uebersicht ohne Benutzerliste und ohne komplexe Statistiken." title="Admin Dashboard" />
      {error ? <ErrorState message={error} /> : null}
      <AdminStatsGrid stats={stats} />
      <AdminActions />
    </ScreenContainer>
  );
}
