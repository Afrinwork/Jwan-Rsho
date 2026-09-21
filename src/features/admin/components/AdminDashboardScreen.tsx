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
import { AdminDashboardCard } from "@/src/features/admin/components/AdminDashboardCard";
import { EditUserSheet } from "@/src/features/admin/components/EditUserSheet";
import { UserActionSheet } from "@/src/features/admin/components/UserActionSheet";
import { useOwnAdmins } from "@/src/features/admin/hooks/useOwnAdmins";
import { useUserActions } from "@/src/features/admin/hooks/useUserActions";
import { UserProfile } from "@/src/types/user";

type ConfirmMode = "deactivate" | "reactivate" | "delete";

export function AdminDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation("admin");
  const { admins, error, loading, reload } = useOwnAdmins();
  const userActions = useUserActions(reload);
  const [actionTarget, setActionTarget] = useState<UserProfile | null>(null);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode | null>(null);
  const [editing, setEditing] = useState(false);

  async function handleConfirmAction() {
    const target = actionTarget;
    const mode = confirmMode;
    setConfirmMode(null);
    setActionTarget(null);
    if (!target || !mode) return;

    if (mode === "delete") {
      await userActions.remove(target.email);
    } else {
      await userActions.setActive(target.email, mode === "reactivate");
    }
  }

  async function handleSaveEdit(values: { fullName: string; email: string }) {
    const target = actionTarget;
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
    return <LoadingView label={t("adminDashboard.loading")} />;
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AnimatedEntrance>
          <CompactScreenHeader subtitle={t("adminDashboard.subtitle")} title={t("adminDashboard.title")} />
        </AnimatedEntrance>
        <AnimatedEntrance delay={40}>
          <AppButton label={t("adminDashboard.addAdmin")} onPress={() => router.push(routes.adminCreateUser)} />
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
        {!admins.length ? (
          <AnimatedEntrance delay={90}>
            <EmptyState message={t("adminDashboard.emptyMessage")} title={t("adminDashboard.emptyTitle")} />
          </AnimatedEntrance>
        ) : (
          <AnimatedEntrance delay={100} style={styles.list}>
            {admins.map((admin) => (
              <AdminDashboardCard
                admin={admin}
                busy={userActions.busyEmail === admin.email}
                key={admin.id}
                onOpenActions={() => setActionTarget(admin)}
              />
            ))}
          </AnimatedEntrance>
        )}
      </ScrollView>
      <UserActionSheet
        isActive={actionTarget?.isActive !== false}
        onClose={() => setActionTarget(null)}
        onSelectDelete={() => setConfirmMode("delete")}
        onSelectEdit={() => setEditing(true)}
        onSelectToggleActive={() => setConfirmMode(actionTarget?.isActive === false ? "reactivate" : "deactivate")}
        userName={actionTarget?.fullName ?? ""}
        visible={Boolean(actionTarget) && confirmMode === null && !editing}
      />
      <EditUserSheet
        error={userActions.error}
        initialEmail={actionTarget?.email ?? ""}
        initialFullName={actionTarget?.fullName ?? ""}
        onClose={() => setEditing(false)}
        onSave={(values) => void handleSaveEdit(values)}
        saving={Boolean(actionTarget) && userActions.busyEmail === actionTarget?.email}
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
