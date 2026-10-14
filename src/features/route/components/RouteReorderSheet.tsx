import { Dismiss20Regular, ReOrderDotsVertical20Regular } from "@fluentui/react-native-icons";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReorderableList, { useIsActive, useReorderableDrag } from "react-native-reorderable-list";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/src/components/ui/AppText";
import { routeT } from "@/src/features/route/i18n/routeT";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { formatEtaTime } from "@/src/features/route/utils/routeFormat";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type RouteReorderSheetProps = {
  visible: boolean;
  // The stops still ahead, in the current driving order.
  pendingMarkers: MapCustomerMarker[];
  // Same numbers as the pins on the map.
  stopNumberById: Map<string, number>;
  // Approximate arrival per stop — follows the order, so it changes with it.
  etaById: Map<string, Date>;
  currentStopId: string | null;
  onMove: (customerId: string, pendingPosition: number) => void;
  onPressPosition: (customerId: string) => void;
  onClose: () => void;
};

// Mid-drive customer list: every remaining stop can be moved anywhere
// (hold a row and drag it, or tap the number to type a position) — not just
// "pick the last stop". The route, pins and navigation follow the new order.
export function RouteReorderSheet(props: RouteReorderSheetProps) {
  const t = routeT;
  const colors = useThemeColors();

  return (
    <Modal animationType="slide" onRequestClose={props.onClose} transparent visible={props.visible}>
      {/* A Modal is its own native root: without this, Android delivers no
          gestures to the drag list inside it. */}
      <GestureHandlerRootView style={styles.root}>
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
          <ReorderableList
            data={props.pendingMarkers}
            keyExtractor={(item) => item.id}
            onReorder={({ from, to }) => {
              const moved = props.pendingMarkers[from];
              if (moved && from !== to) props.onMove(moved.id, to + 1);
            }}
            renderItem={({ item, index }) => (
              <ReorderRow
                eta={props.etaById.get(item.id) ?? null}
                isCurrent={item.id === props.currentStopId}
                marker={item}
                number={props.stopNumberById.get(item.id) ?? index + 1}
                onPressPosition={() => props.onPressPosition(item.id)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

type ReorderRowProps = {
  marker: MapCustomerMarker;
  number: number;
  eta: Date | null;
  isCurrent: boolean;
  onPressPosition: () => void;
};

function ReorderRow(props: ReorderRowProps) {
  const t = routeT;
  const colors = useThemeColors();
  const drag = useReorderableDrag();
  const isActive = useIsActive();

  return (
    <Pressable
      delayLongPress={250}
      onLongPress={drag}
      style={[
        styles.row,
        { borderColor: colors.border, backgroundColor: isActive ? colors.primaryMuted : colors.surfaceElevated },
      ]}
    >
      <Pressable
        accessibilityHint={t("manualOrder.positionHint")}
        accessibilityRole="button"
        hitSlop={8}
        onPress={props.onPressPosition}
        style={[styles.index, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}
      >
        <AppText color="primary" variant="label">
          {props.number}
        </AppText>
      </Pressable>
      <View style={styles.rowText}>
        <AppText numberOfLines={1} variant="bodyMedium">
          {props.marker.title}
        </AppText>
        <View style={styles.captionRow}>
          <AppText color={props.isCurrent ? "primary" : "muted"} numberOfLines={1} style={styles.caption} variant="caption">
            {props.isCurrent ? t("reorderSheet.current") : props.marker.description}
          </AppText>
          {/* Only an estimate — drivers screenshot this list to tell customers. */}
          {props.eta ? (
            <AppText color="muted" variant="caption">
              {`~${formatEtaTime(props.eta)}`}
            </AppText>
          ) : null}
        </View>
      </View>
      {/* Touching the handle starts the drag right away, no long press. */}
      <Pressable accessibilityLabel={t("manualOrder.dragHandle")} hitSlop={8} onPressIn={drag} style={styles.dragHandle}>
        <ReOrderDotsVertical20Regular color={colors.mutedText} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  captionRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  caption: { flexShrink: 1 },
  dragHandle: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
});
