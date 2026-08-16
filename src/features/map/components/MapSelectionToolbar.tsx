import { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { mapT } from "@/src/features/map/i18n/mapT";

import { AppButton } from "@/src/components/ui/AppButton";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { MapSelectionTool } from "@/src/features/map/types/mapSelectionTypes";

type MapSelectionToolbarProps = {
  activeTool: MapSelectionTool;
  onSelectTool: (tool: MapSelectionTool) => void;
  onResetSelection: () => void;
  rightSlot?: ReactNode;
};

export function MapSelectionToolbar(props: MapSelectionToolbarProps) {
  const colors = useThemeColors();
  const t = mapT;
  const active = props.activeTool === "polygon";

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          <Pressable
            onPress={() => props.onSelectTool("polygon")}
            style={[
              styles.toolChip,
              {
                borderColor: colors.border,
                backgroundColor: active ? colors.primary : colors.surface,
              },
            ]}
          >
            <Text style={[styles.toolLabel, { color: active ? colors.surface : colors.text }]}>
              {active ? t("selectionToolbar.drawingActive") : t("selectionToolbar.drawPolygon")}
            </Text>
          </Pressable>
          <View style={styles.resetChip}>
            <AppButton
              label={t("selectionToolbar.clearSelection")}
              onPress={props.onResetSelection}
              size="compact"
              variant="secondary"
            />
          </View>
          {props.rightSlot}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  scrollContent: {
    paddingRight: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  toolChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  toolLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  resetChip: {
    minWidth: 148,
  },
});
