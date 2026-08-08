import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { spacing } from "@/src/constants/spacing";
import { CountryForm, CountryFormValues } from "@/src/features/countries/components/CountryForm";
import { CountryListItem } from "@/src/features/countries/components/CountryListItem";
import { useCountries } from "@/src/features/countries/hooks/useCountries";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Country } from "@/src/types/country";

export function CountryManagementSection() {
  const { countries, loading, error, addCountry, updateCountry, toggleActive } = useCountries();
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const colors = useThemeColors();

  async function handleAdd(values: CountryFormValues) {
    await addCountry(values);
    setShowAddForm(false);
  }

  async function handleEdit(values: CountryFormValues) {
    if (!editingCountry) {
      return;
    }
    await updateCountry(editingCountry.id, values);
    setEditingCountry(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Laender</Text>
        {!showAddForm ? <AppButton label="Land hinzufuegen" onPress={() => setShowAddForm(true)} variant="secondary" /> : null}
      </View>
      {showAddForm ? <CountryForm onCancel={() => setShowAddForm(false)} onSubmit={handleAdd} submitLabel="Land speichern" /> : null}
      {loading ? <LoadingView label="Laender laden..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && countries.length === 0 ? <EmptyState message="Noch keine Laender angelegt." title="Keine Laender" /> : null}
      {countries.map((country) => (
        editingCountry?.id === country.id ? (
          <CountryForm initialValues={{ name: country.name, isoCode: country.isoCode ?? "", sortOrder: country.sortOrder }} key={country.id} onCancel={() => setEditingCountry(null)} onSubmit={handleEdit} submitLabel="Aenderungen speichern" />
        ) : (
          <CountryListItem country={country} key={country.id} onEdit={() => setEditingCountry(country)} onToggleActive={() => void toggleActive(country)} />
        )
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 18, fontWeight: "700" },
});
