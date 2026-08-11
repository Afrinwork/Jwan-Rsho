import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useThemeColors } from "@/src/hooks/useThemeColors";

type CitySelectionBarProps = {
  selectedCount: number;
};

export function CitySelectionBar(props: CitySelectionBarProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("cities");

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.countChip, { backgroundColor: colors.backgroundAccent, borderColor: colors.primary }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>{t("selectionBar.selectedCount", { count: props.selectedCount })}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  countChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
