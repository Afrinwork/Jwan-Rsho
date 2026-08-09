import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { MapSelectionTool } from "@/src/features/map/types/mapSelectionTypes";

type MapSelectionToolbarProps = {
  activeTool: MapSelectionTool;
  onSelectTool: (tool: MapSelectionTool) => void;
  onResetSelection: () => void;
};

export function MapSelectionToolbar(props: MapSelectionToolbarProps) {
  const colors = useThemeColors();
  const active = props.activeTool === "polygon";

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => props.onSelectTool("polygon")}
        style={[
          styles.toolChip,
          { borderColor: colors.border, backgroundColor: active ? colors.primary : colors.surface },
        ]}
      >
        <Text style={[styles.toolLabel, { color: active ? colors.surface : colors.text }]}>
          {active ? "Malen aktiv" : "Polygon malen"}
        </Text>
      </Pressable>
      <View style={styles.resetChip}>
        <AppButton label="Auswahl loeschen" onPress={props.onResetSelection} size="compact" variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  toolChip: { flex: 1, borderWidth: 1, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 12 },
  toolLabel: { fontSize: 14, fontWeight: "600" },
  resetChip: { width: 148 },
});
