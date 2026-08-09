import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { spacing } from "@/src/constants/spacing";
import { CountryForm, CountryFormValues } from "@/src/features/countries/components/CountryForm";
import { CountryListItem } from "@/src/features/countries/components/CountryListItem";
import { useCountries } from "@/src/features/countries/hooks/useCountries";
import { ManagementSectionShell } from "@/src/features/management/components/ManagementSectionShell";
import { Country } from "@/src/types/country";

export function CountryManagementSection() {
  const { countries, loading, error, addCountry, updateCountry, toggleActive, deleteCountry } = useCountries();
  const [mode, setMode] = useState<"list" | "create">("list");
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Country | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleAdd(values: CountryFormValues) {
    setActionError(null);
    setSuccessMessage(null);
    await addCountry(values);
    setSuccessMessage("Land wurde erfolgreich hinzugefuegt.");
    setMode("list");
  }

  async function handleEdit(values: CountryFormValues) {
    if (!editingCountry) {
      return;
    }

    setActionError(null);
    setSuccessMessage(null);
    await updateCountry(editingCountry.id, values);
    setSuccessMessage("Land wurde erfolgreich aktualisiert.");
    setEditingCountry(null);
  }

  return (
    <ManagementSectionShell
      createLabel="Land hinzufuegen"
      listLabel="Landansicht"
      mode={mode}
      onModeChange={setMode}
      subtitle="Laender als feste Auswahl fuer Kunden, Kartenfilter und Regionen pflegen."
      title="Laender"
    >
      {mode === "create" ? (
        <CountryForm onCancel={() => setMode("list")} onSubmit={handleAdd} submitLabel="Land speichern" />
      ) : null}
      {mode === "list" ? (
        <View style={styles.container}>
          {loading ? <LoadingView label="Laender laden..." /> : null}
          {error ? <ErrorState message={error} /> : null}
          {actionError ? <ErrorState message={actionError} /> : null}
          {successMessage ? <SuccessState message={successMessage} /> : null}
          {!loading && !error && countries.length === 0 ? (
            <EmptyState
              message="Laender sind optional. Lege nur Eintraege an, wenn du spaeter nach Land filtern oder sauber strukturieren willst."
              title="Keine Laender"
            />
          ) : null}
          {countries.map((country) =>
            editingCountry?.id === country.id ? (
              <CountryForm
                initialValues={{ name: country.name, isoCode: country.isoCode ?? "", sortOrder: country.sortOrder }}
                key={country.id}
                onCancel={() => setEditingCountry(null)}
                onSubmit={handleEdit}
                submitLabel="Aenderungen speichern"
              />
            ) : (
              <CountryListItem
                country={country}
                key={country.id}
                onEdit={() => setEditingCountry(country)}
                onDelete={() => setDeleteTarget(country)}
                onToggleActive={() => {
                  void toggleActive(country)
                    .then(() =>
                      setSuccessMessage(country.isActive ? "Land wurde deaktiviert." : "Land wurde wieder aktiviert."),
                    )
                    .catch((value) =>
                      setActionError(value instanceof Error ? value.message : "Land konnte nicht aktualisiert werden."),
                    );
                }}
              />
            ),
          )}
        </View>
      ) : null}
      <ConfirmDialog
        confirmLabel="Loeschen"
        destructive
        message="Dieses Land wird nur geloescht, wenn es noch von keinem Kunden verwendet wird."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void deleteCountry(deleteTarget)
              .then(() => setSuccessMessage("Land wurde geloescht."))
              .catch((value) =>
                setActionError(value instanceof Error ? value.message : "Land konnte nicht geloescht werden."),
              );
          }
          setDeleteTarget(null);
        }}
        title="Land wirklich loeschen?"
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
