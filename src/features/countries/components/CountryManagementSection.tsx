import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("countries");
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
    setSuccessMessage(t("management.addSuccess"));
    setMode("list");
  }

  async function handleEdit(values: CountryFormValues) {
    if (!editingCountry) {
      return;
    }

    setActionError(null);
    setSuccessMessage(null);
    await updateCountry(editingCountry.id, values);
    setSuccessMessage(t("management.updateSuccess"));
    setEditingCountry(null);
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
        <CountryForm onCancel={() => setMode("list")} onSubmit={handleAdd} submitLabel={t("management.saveNewLabel")} />
      ) : null}
      {mode === "list" ? (
        <View style={styles.container}>
          {loading ? <LoadingView label={t("management.loading")} /> : null}
          {error ? <ErrorState message={error} /> : null}
          {actionError ? <ErrorState message={actionError} /> : null}
          {successMessage ? <SuccessState message={successMessage} /> : null}
          {!loading && !error && countries.length === 0 ? (
            <EmptyState
              message={t("management.emptyMessage")}
              title={t("management.emptyTitle")}
            />
          ) : null}
          {countries.map((country) =>
            editingCountry?.id === country.id ? (
              <CountryForm
                initialValues={{ name: country.name, isoCode: country.isoCode ?? "", sortOrder: country.sortOrder }}
                key={country.id}
                onCancel={() => setEditingCountry(null)}
                onSubmit={handleEdit}
                submitLabel={t("management.saveChangesLabel")}
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
                      setSuccessMessage(country.isActive ? t("management.deactivatedSuccess") : t("management.activatedSuccess")),
                    )
                    .catch((value) =>
                      setActionError(value instanceof Error ? value.message : t("management.toggleError")),
                    );
                }}
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
            void deleteCountry(deleteTarget)
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
