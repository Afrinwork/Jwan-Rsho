import { useState } from "react";
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
    setSuccessMessage("Region wurde erfolgreich hinzugefuegt.");
    setMode("list");
  }

  async function handleEdit(values: RegionFormValues) {
    if (!editingRegion) {
      return;
    }

    setActionError(null);
    setSuccessMessage(null);
    await updateRegion(editingRegion.id, values);
    setSuccessMessage("Region wurde erfolgreich aktualisiert.");
    setEditingRegion(null);
  }

  return (
    <ManagementSectionShell
      createLabel="Region hinzufuegen"
      listLabel="Regionsansicht"
      mode={mode}
      onModeChange={setMode}
      subtitle="Regionen passend zu Laendern strukturieren und fuer Filter aktiv halten."
      title="Regionen"
    >
      {mode === "create" ? (
        <RegionForm onCancel={() => setMode("list")} onSubmit={handleAdd} submitLabel="Region speichern" />
      ) : null}
      {mode === "list" ? (
        <View style={styles.container}>
          {loading ? <LoadingView label="Regionen laden..." /> : null}
          {error ? <ErrorState message={error} /> : null}
          {actionError ? <ErrorState message={actionError} /> : null}
          {successMessage ? <SuccessState message={successMessage} /> : null}
          {!loading && !error && regions.length === 0 ? (
            <EmptyState
              message="Regionen sind optional. Sie sind sinnvoll, wenn du Kunden spaeter nach Gebieten auf Karte und in Filtern ordnen willst."
              title="Keine Regionen"
            />
          ) : null}
          {regions.map((region) =>
            editingRegion?.id === region.id ? (
              <RegionForm
                initialValues={{ name: region.name, country: region.country, city: region.city ?? "" }}
                key={region.id}
                onCancel={() => setEditingRegion(null)}
                onSubmit={handleEdit}
                submitLabel="Aenderungen speichern"
              />
            ) : (
              <RegionListItem
                key={region.id}
                onEdit={() => setEditingRegion(region)}
                onDelete={() => setDeleteTarget(region)}
                onToggleActive={() => {
                  void toggleActive(region)
                    .then(() =>
                      setSuccessMessage(region.isActive ? "Region wurde deaktiviert." : "Region wurde wieder aktiviert."),
                    )
                    .catch((value) =>
                      setActionError(value instanceof Error ? value.message : "Region konnte nicht aktualisiert werden."),
                    );
                }}
                region={region}
              />
            ),
          )}
        </View>
      ) : null}
      <ConfirmDialog
        confirmLabel="Loeschen"
        destructive
        message="Diese Region wird nur geloescht, wenn sie noch von keinem Kunden verwendet wird."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void deleteRegion(deleteTarget)
              .then(() => setSuccessMessage("Region wurde geloescht."))
              .catch((value) =>
                setActionError(value instanceof Error ? value.message : "Region konnte nicht geloescht werden."),
              );
          }
          setDeleteTarget(null);
        }}
        title="Region wirklich loeschen?"
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
