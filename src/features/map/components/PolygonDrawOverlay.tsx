import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("map");

  if (!props.visible) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
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
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  actionRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  flexButton: { flex: 1, minWidth: 0 },
});
