import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Country } from "@/src/types/country";

type CountryListItemProps = {
  country: Country;
  onEdit: () => void;
  onToggleActive: () => void;
};

export function CountryListItem({ country, onEdit, onToggleActive }: CountryListItemProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.text}>
        <Text style={[styles.name, { color: colors.text }, !country.isActive && { color: colors.mutedText }]}>{country.name}</Text>
        <Text style={[styles.meta, { color: colors.mutedText }]}>
          {(country.isoCode || "Kein ISO-Code")} · Sortierung {country.sortOrder}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onEdit}><Text style={[styles.edit, { color: colors.primary }]}>Bearbeiten</Text></Pressable>
        <Switch onValueChange={onToggleActive} trackColor={{ true: colors.primary }} value={country.isActive} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, padding: spacing.sm },
  text: { gap: 2, flex: 1 },
  name: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 13 },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  edit: { fontSize: 14, fontWeight: "600" },
});
