import { Dismiss20Regular, ReOrderDotsVertical20Regular } from "@fluentui/react-native-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReorderableList, { useIsActive, useReorderableDrag } from "react-native-reorderable-list";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { routeT } from "@/src/features/route/i18n/routeT";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { useTripWhatsapp } from "@/src/features/route/hooks/useTripWhatsapp";
import { ARRIVAL_WINDOW_OPTIONS_MIN } from "@/src/features/route/services/tripWhatsappService";
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
  // Picking customers, the arrival window and telling them by WhatsApp.
  whatsapp: ReturnType<typeof useTripWhatsapp>;
  onMove: (customerId: string, pendingPosition: number) => void;
  onPressPosition: (customerId: string) => void;
  onClose: () => void;
};

function windowLabel(minutes: number) {
  if (!minutes) return routeT("whatsappNotify.windowNone");
  return minutes < 60
    ? routeT("whatsappNotify.minutes", { count: minutes })
    : routeT("whatsappNotify.hours", { count: minutes / 60 });
}

// Mid-drive customer list: every remaining stop can be moved anywhere
// (hold a row and drag it, or tap the number to type a position) — not just
// "pick the last stop". The route, pins and navigation follow the new order.
// Ticked customers can be told their arrival time by WhatsApp.
export function RouteReorderSheet(props: RouteReorderSheetProps) {
  const t = routeT;
  const colors = useThemeColors();
  const { whatsapp } = props;
  // The window choices open inline: a second Modal on top of this one
  // freezes the screen.
  const [windowOptionsOpen, setWindowOptionsOpen] = useState(false);
  const selectedCount = whatsapp.selectedIds.length;

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
          <View style={styles.toolRow}>
            <AppText color={selectedCount ? "primary" : "muted"} style={styles.toolText} variant="caption">
              {selectedCount ? t("selectionBar.selectedCount", { count: selectedCount }) : t("whatsappNotify.pickHint")}
            </AppText>
            <Pressable
              accessibilityLabel={t("whatsappNotify.window")}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setWindowOptionsOpen((open) => !open)}
              style={[styles.windowChip, { borderColor: whatsapp.windowMinutes ? colors.primary : colors.border }]}
            >
              <AppText color={whatsapp.windowMinutes ? "primary" : "muted"} variant="caption">
                {`⏱ ${whatsapp.windowMinutes ? `+${windowLabel(whatsapp.windowMinutes)}` : t("whatsappNotify.window")}`}
              </AppText>
            </Pressable>
          </View>
          {windowOptionsOpen ? (
            <View style={styles.windowOptions}>
              {ARRIVAL_WINDOW_OPTIONS_MIN.map((minutes) => {
                const active = whatsapp.windowMinutes === minutes;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={minutes}
                    onPress={() => {
                      whatsapp.setWindowMinutes(minutes);
                      setWindowOptionsOpen(false);
                    }}
                    style={[
                      styles.windowOption,
                      { backgroundColor: active ? colors.primaryMuted : colors.surface, borderColor: active ? colors.primary : colors.border },
                    ]}
                  >
                    <AppText color={active ? "primary" : "default"} variant="caption">
                      {windowLabel(minutes)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <ReorderableList
            data={props.pendingMarkers}
            keyExtractor={(item) => item.id}
            onReorder={({ from, to }) => {
              const moved = props.pendingMarkers[from];
              if (moved && from !== to) props.onMove(moved.id, to + 1);
            }}
            renderItem={({ item, index }) => (
              <ReorderRow
                arrival={whatsapp.arrivalLabel(item.id) ?? null}
                isCurrent={item.id === props.currentStopId}
                marker={item}
                number={props.stopNumberById.get(item.id) ?? index + 1}
                onPressPosition={() => props.onPressPosition(item.id)}
                onToggle={() => whatsapp.toggle(item.id)}
                selected={whatsapp.selectedIds.includes(item.id)}
              />
            )}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
          {whatsapp.error ? (
            <AppText color="danger" variant="caption">
              {whatsapp.error}
            </AppText>
          ) : null}
          {whatsapp.message ? (
            <AppText color="success" variant="caption">
              {whatsapp.message}
            </AppText>
          ) : null}
          {whatsapp.progress ? (
            <View style={[styles.progress, { borderColor: colors.border }]}>
              <AppText variant="bodyMedium">
                {t("whatsappNotify.sending", whatsapp.progress)}
              </AppText>
              <AppText color="muted" variant="caption">
                {t("whatsappNotify.sendingHint")}
              </AppText>
              <AppButton label={t("whatsappNotify.stop")} onPress={whatsapp.stop} size="compact" variant="secondary" />
            </View>
          ) : selectedCount ? (
            <View style={styles.sendRow}>
              <View style={styles.sendButton}>
                <AppButton
                  label={t("whatsappNotify.whatsapp")}
                  loading={whatsapp.preparing}
                  onPress={() => void whatsapp.start("whatsapp")}
                  size="compact"
                />
              </View>
              <View style={styles.sendButton}>
                <AppButton
                  label={t("whatsappNotify.business")}
                  loading={whatsapp.preparing}
                  onPress={() => void whatsapp.start("business")}
                  size="compact"
                />
              </View>
            </View>
          ) : null}
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

type ReorderRowProps = {
  marker: MapCustomerMarker;
  number: number;
  // "~04:17", or with the chosen window "04:17–04:47".
  arrival: string | null;
  isCurrent: boolean;
  selected: boolean;
  onPressPosition: () => void;
  onToggle: () => void;
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
          {props.arrival ? (
            <AppText color="muted" variant="caption">
              {props.arrival}
            </AppText>
          ) : null}
        </View>
      </View>
      <Pressable
        accessibilityLabel={props.selected ? t("stopRow.deselect") : t("stopRow.select")}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: props.selected }}
        hitSlop={8}
        onPress={props.onToggle}
        style={[
          styles.checkbox,
          { backgroundColor: props.selected ? colors.success : "transparent", borderColor: props.selected ? colors.success : colors.border },
        ]}
      >
        {props.selected ? <AppText style={styles.checkmark}>✓</AppText> : null}
      </Pressable>
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
    maxHeight: "80%",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: spacing.sm,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  headerText: { flex: 1, gap: 2 },
  toolRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  toolText: { flex: 1 },
  windowChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  windowOptions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  windowOption: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  list: { flexShrink: 1 },
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
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  dragHandle: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  progress: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.sm, gap: spacing.xs },
  sendRow: { flexDirection: "row", gap: spacing.sm },
  sendButton: { flex: 1 },
});
