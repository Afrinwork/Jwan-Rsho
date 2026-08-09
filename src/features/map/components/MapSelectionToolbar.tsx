import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { MapSelectionTool } from "@/src/features/map/types/mapSelectionTypes";

type MapSelectionToolbarProps = {
  activeTool: MapSelectionTool;
  polygonPointCount: number;
  onSelectTool: (tool: MapSelectionTool) => void;
  onResetSelection: () => void;
  onClosePolygon: () => void;
  onUndoPolygonPoint: () => void;
};

const tools: { id: Exclude<MapSelectionTool, "none">; label: string }[] = [
  { id: "single", label: "Einzel" },
  { id: "circle", label: "Kreis" },
  { id: "polygon", label: "Polygon" },
];

export function MapSelectionToolbar(props: MapSelectionToolbarProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {tools.map((tool) => {
          const active = props.activeTool === tool.id;
          return (
            <Pressable
              key={tool.id}
              onPress={() => props.onSelectTool(tool.id)}
              style={[
                styles.toolChip,
                { borderColor: colors.border, backgroundColor: active ? colors.primary : colors.surface },
              ]}
            >
              <Text style={[styles.toolLabel, { color: active ? colors.surface : colors.text }]}>{tool.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <AppButton label="Auswahl loeschen" onPress={props.onResetSelection} variant="secondary" />
      {props.activeTool === "polygon" ? (
        <View style={styles.row}>
          <View style={styles.flexButton}>
            <AppButton
              disabled={props.polygonPointCount === 0}
              label="Rueckgaengig"
              onPress={props.onUndoPolygonPoint}
              variant="secondary"
            />
          </View>
          <View style={styles.flexButton}>
            <AppButton
              disabled={props.polygonPointCount < 3}
              label="Flaeche schliessen"
              onPress={props.onClosePolygon}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" },
  toolChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  toolLabel: { fontSize: 14, fontWeight: "600" },
  flexButton: { flex: 1, minWidth: 120 },
});
