import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { spacing } from "@/src/constants/spacing";
import { ManagementSectionShell } from "@/src/features/management/components/ManagementSectionShell";
import { RegionForm, RegionFormValues } from "@/src/features/regions/components/RegionForm";
import { RegionListItem } from "@/src/features/regions/components/RegionListItem";
import { useRegions } from "@/src/features/regions/hooks/useRegions";
import { Region } from "@/src/types/region";

export function RegionManagementSection() {
  const { t } = useTranslation("regions");
  const { regions, loading, error, addRegion, updateRegion, toggleActive, deleteRegion } = useRegions();
  const [mode, setMode] = useState<"list" | "create">("list");
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Region | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleAdd(values: RegionFormValues) {
    setActionError(null);
    setSuccessMessage(null);
    await addRegion(values);
    setSuccessMessage(t("management.addSuccess"));
    setMode("list");
  }

  async function handleEdit(values: RegionFormValues) {
    if (!editingRegion) {
      return;
    }

    setActionError(null);
    setSuccessMessage(null);
    await updateRegion(editingRegion.id, values);
    setSuccessMessage(t("management.updateSuccess"));
    setEditingRegion(null);
  }

  return (
    <ManagementSectionShell
      createLabel={t("management.createLabel")}
      listLabel={t("management.listLabel")}
      mode={mode}
      onModeChange={setMode}
      subtitle={t("management.subtitle")}
      title={t("management.title")}
    >
      {mode === "create" ? (
        <RegionForm onCancel={() => setMode("list")} onSubmit={handleAdd} submitLabel={t("management.saveNewLabel")} />
      ) : null}
      {mode === "list" ? (
        <View style={styles.container}>
          {loading ? <LoadingView label={t("management.loading")} /> : null}
          {error ? <ErrorState message={error} /> : null}
          {actionError ? <ErrorState message={actionError} /> : null}
          {successMessage ? <SuccessState message={successMessage} /> : null}
          {!loading && !error && regions.length === 0 ? (
            <EmptyState
              message={t("management.emptyMessage")}
              title={t("management.emptyTitle")}
            />
          ) : null}
          {regions.map((region) =>
            editingRegion?.id === region.id ? (
              <RegionForm
                initialValues={{ name: region.name, country: region.country, city: region.city ?? "" }}
                key={region.id}
                onCancel={() => setEditingRegion(null)}
                onSubmit={handleEdit}
                submitLabel={t("management.saveChangesLabel")}
              />
            ) : (
              <RegionListItem
                key={region.id}
                onEdit={() => setEditingRegion(region)}
                onDelete={() => setDeleteTarget(region)}
                onToggleActive={() => {
                  void toggleActive(region)
                    .then(() =>
                      setSuccessMessage(region.isActive ? t("management.deactivatedSuccess") : t("management.activatedSuccess")),
                    )
                    .catch((value) =>
                      setActionError(value instanceof Error ? value.message : t("management.toggleError")),
                    );
                }}
                region={region}
              />
            ),
          )}
        </View>
      ) : null}
      <ConfirmDialog
        confirmLabel={t("common:delete")}
        destructive
        message={t("management.deleteConfirmMessage")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void deleteRegion(deleteTarget)
              .then(() => setSuccessMessage(t("management.deleteSuccess")))
              .catch((value) =>
                setActionError(value instanceof Error ? value.message : t("management.deleteError")),
              );
          }
          setDeleteTarget(null);
        }}
        title={t("management.deleteConfirmTitle")}
        visible={Boolean(deleteTarget)}
      />
    </ManagementSectionShell>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
