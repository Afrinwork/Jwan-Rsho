import { CheckmarkCircle20Regular, Navigation20Regular, ReOrderDotsVertical20Regular } from "@fluentui/react-native-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useIsActive, useReorderableDrag } from "react-native-reorderable-list";

import { AppBadge } from "@/src/components/ui/AppBadge";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { routeT } from "@/src/features/route/i18n/routeT";
import { RouteStop } from "@/src/features/route/types/routeTypes";
import { formatDistanceKm, formatEtaTime } from "@/src/features/route/utils/routeFormat";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";
import { OrderWithItems } from "@/src/types/order";

type RouteStopRowProps = {
  stop: RouteStop;
  orders: OrderWithItems[];
  selected: boolean;
  onToggleSelection: () => void;
  onNavigate: () => void;
  // Manual ordering — tapping the stop number opens "move to position N";
  // holding the card (or touching the handle) drags it to a new position.
  // Only render inside a ReorderableList, which provides the drag context.
  onPressPosition: () => void;
};

export function RouteStopRow(props: RouteStopRowProps) {
  const t = routeT;
  const colors = useThemeColors();
  const drag = useReorderableDrag();
  const isActive = useIsActive();
  const { marker } = props.stop;
  const items = props.orders.flatMap((order) => order.items);

  return (
    <Pressable delayLongPress={250} onLongPress={drag} style={isActive ? styles.dragging : undefined}>
      <AppCard
        contentStyle={styles.card}
        frosted
        style={[
          styles.cardFrame,
          {
            backgroundColor: props.selected ? "#F6D9C5" : "#FBE9DC",
            borderColor: props.selected ? colors.primaryStrong : "#E8B38A",
            shadowColor: colors.primary,
          },
        ]}
        tone={props.selected ? "primary" : "surface"}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityHint={t("manualOrder.positionHint")}
            accessibilityRole="button"
            hitSlop={8}
            onPress={props.onPressPosition}
            style={[styles.index, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}
          >
            <AppText color="primary" variant="label">
              {props.stop.orderIndex + 1}
            </AppText>
          </Pressable>
          <View style={styles.headerText}>
            <AppText variant="subheading">{marker.description}</AppText>
            <AppText color="muted" variant="caption">
              {marker.city}
            </AppText>
          </View>
          <Pressable
            accessibilityLabel={t("manualOrder.dragHandle")}
            hitSlop={8}
            onPressIn={drag}
            style={[styles.moveButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <ReOrderDotsVertical20Regular color={colors.primary} />
          </Pressable>
        </View>
        <View style={styles.addressBlock}>
          <AppText variant="body">{marker.title}</AppText>
          <AppText color="muted" variant="caption">
            {t("stopRow.arrival", {
              time: formatEtaTime(props.stop.cumulativeEta),
              distance: formatDistanceKm(props.stop.cumulativeDistanceKm),
            })}
          </AppText>
        </View>
        {items.length ? (
          <View style={styles.ordersBlock}>
            <AppText color="muted" style={styles.noteLabel} variant="caption">
              {t("stopRow.orders")}
            </AppText>
            <View style={styles.itemsRow}>
              {items.map((item) => (
                <View
                  key={item.id}
                  style={[styles.itemChip, { backgroundColor: colors.successBackground, borderColor: colors.successBorder }]}
                >
                  <AppText color="success" variant="caption">
                    {item.productNameSnapshot}: {item.quantity} {item.unit}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        {marker.note.trim() ? (
          <View style={[styles.noteCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <AppText color="muted" style={styles.noteLabel} variant="caption">
              {t("stopRow.note")}
            </AppText>
            <AppText color="muted" style={styles.note} variant="caption">
              {marker.note}
            </AppText>
          </View>
        ) : null}
        <View style={styles.footerRow}>
          <View style={styles.metaRow}>
            <AppBadge label={formatEtaTime(props.stop.cumulativeEta)} tone="primary" />
            {props.stop.isEstimated ? <AppBadge label={t("stopRow.estimated")} tone="neutral" /> : null}
          </View>
          <Pressable
            onPress={props.onNavigate}
            style={[styles.navigateButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <Navigation20Regular color={colors.primary} />
            <AppText style={styles.selectLabel} variant="caption">
              {t("stopRow.navigate")}
            </AppText>
          </Pressable>
          <Pressable
            onPress={props.onToggleSelection}
            style={[
              styles.selectButton,
              {
                backgroundColor: props.selected ? colors.primary : colors.surfaceElevated,
                borderColor: props.selected ? colors.primaryStrong : colors.border,
              },
            ]}
          >
            <CheckmarkCircle20Regular color={props.selected ? colors.primaryContrast : colors.primary} />
            <AppText color={props.selected ? colors.primaryContrast : colors.text} style={styles.selectLabel} variant="caption">
              {props.selected ? t("stopRow.deselect") : t("stopRow.select")}
            </AppText>
          </Pressable>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardFrame: { borderRadius: radius.xl, padding: 2, borderWidth: 1 },
  card: { padding: spacing.md, gap: spacing.sm },
  header: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  index: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, gap: 2 },
  dragging: { opacity: 0.9 },
  moveButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navigateButton: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  addressBlock: { gap: 2 },
  ordersBlock: { gap: spacing.xxs },
  itemsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xxs },
  itemChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.xxs,
  },
  noteLabel: { textTransform: "uppercase", letterSpacing: 0.4 },
  note: { fontStyle: "italic" },
  footerRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.xs },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  selectButton: {
    marginLeft: "auto",
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  selectLabel: { fontWeight: "700" },
});
