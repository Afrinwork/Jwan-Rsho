import { ArrowDown20Regular, ArrowUp20Regular, Dismiss20Regular } from "@fluentui/react-native-icons";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/src/components/ui/AppText";
import { routeT } from "@/src/features/route/i18n/routeT";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type RouteReorderSheetProps = {
  visible: boolean;
  // The stops still ahead, in the current driving order.
  pendingMarkers: MapCustomerMarker[];
  // Same numbers as the pins on the map.
  stopNumberById: Map<string, number>;
  currentStopId: string | null;
  onMove: (customerId: string, pendingPosition: number) => void;
  onPressPosition: (customerId: string) => void;
  onClose: () => void;
};

// Mid-drive customer list: every remaining stop can be moved anywhere
// (arrows, or tap the number to type a position) — not just "pick the
// last stop". The route, pins and navigation follow the new order.
export function RouteReorderSheet(props: RouteReorderSheetProps) {
  const t = routeT;
  const colors = useThemeColors();

  return (
    <Modal animationType="slide" onRequestClose={props.onClose} transparent visible={props.visible}>
      <Pressable accessibilityLabel={t("common:close")} onPress={props.onClose} style={styles.backdrop} />
      <SafeAreaView edges={["bottom"]} style={[styles.sheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <AppText variant="subheading">{t("reorderSheet.title", { count: props.pendingMarkers.length })}</AppText>
            <AppText color="muted" variant="caption">
              {t("manualOrder.hint")}
            </AppText>
          </View>
          <Pressable accessibilityLabel={t("common:close")} hitSlop={12} onPress={props.onClose}>
            <Dismiss20Regular color={colors.text} />
          </Pressable>
        </View>
        <FlatList
          data={props.pendingMarkers}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={[styles.row, { borderColor: colors.border }]}>
              <Pressable
                accessibilityHint={t("manualOrder.positionHint")}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => props.onPressPosition(item.id)}
                style={[styles.index, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}
              >
                <AppText color="primary" variant="label">
                  {props.stopNumberById.get(item.id) ?? index + 1}
                </AppText>
              </Pressable>
              <View style={styles.rowText}>
                <AppText numberOfLines={1} variant="bodyMedium">
                  {item.title}
                </AppText>
                <AppText color={item.id === props.currentStopId ? "primary" : "muted"} numberOfLines={1} variant="caption">
                  {item.id === props.currentStopId ? t("reorderSheet.current") : item.description}
                </AppText>
              </View>
              {index > 0 ? (
                <Pressable
                  accessibilityLabel={t("manualOrder.moveUp")}
                  hitSlop={6}
                  onPress={() => props.onMove(item.id, index)}
                  style={[styles.moveButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                >
                  <ArrowUp20Regular color={colors.primary} />
                </Pressable>
              ) : null}
              {index < props.pendingMarkers.length - 1 ? (
                <Pressable
                  accessibilityLabel={t("manualOrder.moveDown")}
                  hitSlop={6}
                  onPress={() => props.onMove(item.id, index + 2)}
                  style={[styles.moveButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                >
                  <ArrowDown20Regular color={colors.primary} />
                </Pressable>
              ) : null}
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    maxHeight: "70%",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: spacing.sm,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  headerText: { flex: 1, gap: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  index: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 2 },
  moveButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
