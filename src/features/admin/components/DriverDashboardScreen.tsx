import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { AppButton } from "@/src/components/ui/AppButton";
import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { routes } from "@/src/constants/routes";
import { spacing } from "@/src/constants/spacing";
import { DriverDashboardCard } from "@/src/features/admin/components/DriverDashboardCard";
import { EditUserSheet } from "@/src/features/admin/components/EditUserSheet";
import { DriverWithStats, useOwnDriversWithStats } from "@/src/features/admin/hooks/useOwnDriversWithStats";
import { useUserActions } from "@/src/features/admin/hooks/useUserActions";

type ConfirmMode = "deactivate" | "reactivate" | "delete";

export function DriverDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation("admin");
  const { driversWithStats, error, loading, reload } = useOwnDriversWithStats();
  const userActions = useUserActions(reload);
  const [actionTarget, setActionTarget] = useState<DriverWithStats | null>(null);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode | null>(null);
  const [editing, setEditing] = useState(false);
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);

  async function handleConfirmAction() {
    const target = actionTarget;
    const mode = confirmMode;
    setConfirmMode(null);
    setActionTarget(null);
    if (!target || !mode) return;

    if (mode === "delete") {
      await userActions.remove(target.driver.email);
    } else {
      await userActions.setActive(target.driver.email, mode === "reactivate");
    }
  }

  async function handleSaveEdit(values: { fullName: string; email: string }) {
    const target = actionTarget?.driver;
    if (!target) return;

    const saved = await userActions.update(target.email, {
      fullName: values.fullName !== target.fullName ? values.fullName : undefined,
      newEmail: values.email !== target.email ? values.email : undefined,
    });

    if (saved) {
      setEditing(false);
      setActionTarget(null);
    }
  }

  if (loading) {
    return <LoadingView label={t("driverDashboard.loading")} />;
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AnimatedEntrance>
          <CompactScreenHeader subtitle={t("driverDashboard.subtitle")} title={t("driverDashboard.title")} />
        </AnimatedEntrance>
        <AnimatedEntrance delay={40}>
          <AppButton label={t("driverDashboard.addDriver")} onPress={() => router.push(routes.adminCreateUser)} />
        </AnimatedEntrance>
        {error ? (
          <AnimatedEntrance delay={70}>
            <ErrorState message={error} />
          </AnimatedEntrance>
        ) : null}
        {userActions.error ? (
          <AnimatedEntrance delay={70}>
            <ErrorState message={userActions.error} />
          </AnimatedEntrance>
        ) : null}
        {!driversWithStats.length ? (
          <AnimatedEntrance delay={90}>
            <EmptyState message={t("driverDashboard.emptyMessage")} title={t("driverDashboard.emptyTitle")} />
          </AnimatedEntrance>
        ) : (
          <AnimatedEntrance delay={100} style={styles.list}>
            {driversWithStats.map((entry) => (
              <DriverDashboardCard
                busy={userActions.busyEmail === entry.driver.email}
                entry={entry}
                expanded={expandedDriverId === entry.driver.id}
                key={entry.driver.id}
                onDelete={() => {
                  setActionTarget(entry);
                  setConfirmMode("delete");
                }}
                onEdit={() => {
                  setActionTarget(entry);
                  setEditing(true);
                }}
                onOpenDriverView={() =>
                  router.push({
                    pathname: "/management/driver-map",
                    params: {
                      driverName: entry.driver.fullName,
                      ids: entry.assignedCustomerIds.join(","),
                      openCount: String(entry.openCount),
                      completedToday: String(entry.completedToday),
                      ...(entry.checkIn?.latitude !== undefined && entry.checkIn?.longitude !== undefined
                        ? {
                            lat: String(entry.checkIn.latitude),
                            lng: String(entry.checkIn.longitude),
                            address: entry.checkIn.address ?? "",
                            updatedAt: entry.checkIn.updatedAt,
                          }
                        : {}),
                    },
                  })
                }
                onToggleActive={() => {
                  setActionTarget(entry);
                  setConfirmMode(entry.driver.isActive === false ? "reactivate" : "deactivate");
                }}
                onToggleExpanded={() => setExpandedDriverId((current) => current === entry.driver.id ? null : entry.driver.id)}
              />
            ))}
          </AnimatedEntrance>
        )}
      </ScrollView>
      <EditUserSheet
        error={userActions.error}
        initialEmail={actionTarget?.driver.email ?? ""}
        initialFullName={actionTarget?.driver.fullName ?? ""}
        onClose={() => setEditing(false)}
        onSave={(values) => void handleSaveEdit(values)}
        saving={Boolean(actionTarget) && userActions.busyEmail === actionTarget?.driver.email}
        visible={Boolean(actionTarget) && editing}
      />
      <ConfirmDialog
        destructive={confirmMode !== "reactivate"}
        message={confirmMode ? t(`userActions.${confirmMode}ConfirmMessage`) : ""}
        onCancel={() => setConfirmMode(null)}
        onConfirm={() => void handleConfirmAction()}
        title={confirmMode ? t(`userActions.${confirmMode}ConfirmTitle`) : ""}
        visible={confirmMode !== null}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  list: {
    gap: spacing.sm,
  },
});
