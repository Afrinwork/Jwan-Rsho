import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";

type SelectedCustomerRowProps = {
  marker: MapCustomerMarker;
  onRemove: () => void;
};

export function SelectedCustomerRow({ marker, onRemove }: SelectedCustomerRowProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.name, { color: colors.text }]}>
        {marker.numberLabel}. {marker.title}
      </Text>
      <Text style={[styles.meta, { color: colors.mutedText }]}>{marker.description}</Text>
      <Text style={[styles.meta, { color: colors.mutedText }]}>{marker.phone}</Text>
      <Text style={[styles.meta, { color: colors.mutedText }]}>
        {marker.currentOpenOrderId ? "Offene Bestellung vorhanden" : "Keine offene Bestellung"}
      </Text>
      <AppButton label="Entfernen" onPress={onRemove} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: spacing.md, gap: 6 },
  name: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 14 },
});
