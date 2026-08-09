import { StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type PolygonDrawOverlayProps = {
  visible: boolean;
  polygonPointCount: number;
  onClosePolygon: () => void;
  onUndoPolygonPoint: () => void;
};

export function PolygonDrawOverlay(props: PolygonDrawOverlayProps) {
  const colors = useThemeColors();

  if (!props.visible) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <View style={styles.actionRow}>
        <View style={styles.flexButton}>
          <AppButton
            disabled={props.polygonPointCount === 0}
            label="Zurueck"
            onPress={props.onUndoPolygonPoint}
            size="compact"
            variant="secondary"
          />
        </View>
        <View style={styles.flexButton}>
          <AppButton
            disabled={props.polygonPointCount < 3}
            label="Auswahl schliessen"
            onPress={props.onClosePolygon}
            size="compact"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  actionRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  flexButton: { flex: 1, minWidth: 0 },
});
