import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { spacing } from "@/src/constants/spacing";
import { RegionForm, RegionFormValues } from "@/src/features/regions/components/RegionForm";
import { RegionListItem } from "@/src/features/regions/components/RegionListItem";
import { useRegions } from "@/src/features/regions/hooks/useRegions";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Region } from "@/src/types/region";

export function RegionManagementSection() {
  const { regions, loading, error, addRegion, updateRegion, toggleActive } = useRegions();
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const colors = useThemeColors();

  async function handleAdd(values: RegionFormValues) {
    await addRegion(values);
    setShowAddForm(false);
  }

  async function handleEdit(values: RegionFormValues) {
    if (!editingRegion) {
      return;
    }
    await updateRegion(editingRegion.id, values);
    setEditingRegion(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Regionen</Text>
        {!showAddForm ? <AppButton label="Region hinzufuegen" onPress={() => setShowAddForm(true)} variant="secondary" /> : null}
      </View>
      {showAddForm ? <RegionForm onCancel={() => setShowAddForm(false)} onSubmit={handleAdd} submitLabel="Region speichern" /> : null}
      {loading ? <LoadingView label="Regionen laden..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && regions.length === 0 ? <EmptyState message="Noch keine Regionen angelegt." title="Keine Regionen" /> : null}
      {regions.map((region) => (
        editingRegion?.id === region.id ? (
          <RegionForm initialValues={{ name: region.name, country: region.country, city: region.city ?? "" }} key={region.id} onCancel={() => setEditingRegion(null)} onSubmit={handleEdit} submitLabel="Aenderungen speichern" />
        ) : (
          <RegionListItem key={region.id} onEdit={() => setEditingRegion(region)} onToggleActive={() => void toggleActive(region)} region={region} />
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
