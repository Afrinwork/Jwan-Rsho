import { StyleSheet, View } from "react-native";
import { mapT } from "@/src/features/map/i18n/mapT";

import { AppButton } from "@/src/components/ui/AppButton";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { shadows } from "@/src/theme/shadows";

type PolygonDrawOverlayProps = {
  visible: boolean;
  polygonPointCount: number;
  paused: boolean;
  onClosePolygon: () => void;
  onUndoPolygonPoint: () => void;
  onTogglePause: () => void;
};

export function PolygonDrawOverlay(props: PolygonDrawOverlayProps) {
  const colors = useThemeColors();
  const t = mapT;

  if (!props.visible) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.border, shadowColor: colors.shadow }]}>
      <View style={styles.actionRow}>
        <View style={styles.flexButton}>
          <AppButton
            disabled={props.polygonPointCount === 0}
            label={t("polygonDraw.back")}
            onPress={props.onUndoPolygonPoint}
            size="compact"
            variant="secondary"
          />
        </View>
        <View style={styles.flexButton}>
          <AppButton
            label={props.paused ? t("polygonDraw.resume") : t("polygonDraw.pause")}
            onPress={props.onTogglePause}
            size="compact"
            variant={props.paused ? "primary" : "secondary"}
          />
        </View>
        <View style={styles.flexButton}>
          <AppButton
            disabled={props.polygonPointCount < 3}
            label={t("polygonDraw.closeSelection")}
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
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    ...shadows.lg,
  },
  actionRow: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  flexButton: { flex: 1, minWidth: 0 },
});
