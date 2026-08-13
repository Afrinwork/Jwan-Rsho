import { StyleSheet, Text, View } from "react-native";
import { mapT } from "@/src/features/map/i18n/mapT";

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
  const t = mapT;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.name, { color: colors.text }]}>
        {marker.numberLabel}. {marker.title}
      </Text>
      <Text style={[styles.meta, { color: colors.mutedText }]}>{marker.description}</Text>
      <Text style={[styles.meta, { color: colors.mutedText }]}>{marker.phone}</Text>
      <Text style={[styles.meta, { color: colors.mutedText }]}>
        {marker.openOrderCount > 1
          ? t("selectedRow.openOrdersCount", { count: marker.openOrderCount })
          : marker.openOrderCount === 1
            ? t("selectedRow.openOrderSingular")
            : t("selectedRow.noOpenOrder")}
      </Text>
      <AppButton label={t("selectedRow.remove")} onPress={onRemove} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: spacing.md, gap: 6 },
  name: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 14 },
});
