import { ArrowReset20Regular, Eye20Regular, EyeOff20Regular, ReOrderDotsVertical20Regular } from "@fluentui/react-native-icons";
import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { NestedReorderableList, ScrollViewContainer, useIsActive, useReorderableDrag } from "react-native-reorderable-list";
import { useTranslation } from "react-i18next";

import { AppText } from "@/src/components/ui/AppText";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

export type DriverCityVisibility = { city: string; count: number; hidden: boolean };

type DriverStopOrderListProps = {
  // The stops the driver currently sees, in the driver's list order.
  markers: MapCustomerMarker[];
  // Assigned stops hidden from the driver right now (not deleted).
  hiddenMarkers: MapCustomerMarker[];
  cities: DriverCityVisibility[];
  isManualOrder: boolean;
  busy: boolean;
  onMove: (customerId: string, position: number) => void;
  onPressPosition: (customerId: string) => void;
  onReset: () => void;
  onToggleHidden: (customerId: string, hidden: boolean) => void;
  onToggleCity: (city: string, hidden: boolean) => void;
};

// The driver's own list as the admin sees it in the driver view — same
// sorting controls as the driver's route list (tap the number / drag a row),
// plus hiding stops (one by one or a whole city) from the driver without
// deleting them. Every change goes to the DRIVER's data and reaches their
// app live.
export function DriverStopOrderList(props: DriverStopOrderListProps) {
  const { t } = useTranslation("admin");
  const colors = useThemeColors();

  function iconButton(label: string, onPress: () => void, icon: ReactNode) {
    return (
      <Pressable
        accessibilityLabel={label}
        disabled={props.busy}
        hitSlop={6}
        onPress={onPress}
        style={[styles.moveButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: props.busy ? 0.5 : 1 }]}
      >
        {icon}
      </Pressable>
    );
  }

  return (
    <ScrollViewContainer contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {props.cities.length > 1 ? (
        <View style={styles.section}>
          <AppText color="muted" variant="label">
            {t("driverMap.citiesTitle")}
          </AppText>
          <View style={styles.chipRow}>
            {props.cities.map((entry) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: !entry.hidden }}
                disabled={props.busy}
                key={entry.city}
                onPress={() => props.onToggleCity(entry.city, !entry.hidden)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: entry.hidden ? colors.surfaceMuted : colors.primaryMuted,
                    borderColor: entry.hidden ? colors.border : colors.primary,
                  },
                ]}
              >
                {entry.hidden ? <EyeOff20Regular color={colors.mutedText} /> : <Eye20Regular color={colors.primary} />}
                <AppText color={entry.hidden ? "muted" : "primary"} variant="caption">
                  {`${entry.city || t("driverMap.noCity")} (${entry.count})`}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.headerRow}>
        <AppText style={styles.headerTitle} variant="subheading">
          {props.isManualOrder ? t("driverMap.orderManual") : t("driverMap.orderTitle")}
        </AppText>
        {props.isManualOrder ? (
          <Pressable
            accessibilityRole="button"
            onPress={props.onReset}
            style={[styles.pillButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <ArrowReset20Regular color={colors.primary} />
            <AppText variant="caption">{t("route:manualOrder.reset")}</AppText>
          </Pressable>
        ) : null}
      </View>
      <AppText color="muted" variant="caption">
        {t("driverMap.orderHint")}
      </AppText>

      <NestedReorderableList
        data={props.markers}
        dragEnabled={!props.busy}
        keyExtractor={(item) => item.id}
        onReorder={({ from, to }) => {
          const moved = props.markers[from];
          if (moved && from !== to) props.onMove(moved.id, to + 1);
        }}
        renderItem={({ item, index }) => (
          <OrderRow
            hideButton={iconButton(t("driverMap.hideStop"), () => props.onToggleHidden(item.id, true), <EyeOff20Regular color={colors.mutedText} />)}
            marker={item}
            number={index + 1}
            onPressPosition={() => props.onPressPosition(item.id)}
          />
        )}
        scrollEnabled={false}
      />

      {props.hiddenMarkers.length ? (
        <View style={styles.section}>
          <AppText color="muted" variant="label">
            {t("driverMap.hiddenTitle", { count: props.hiddenMarkers.length })}
          </AppText>
          {props.hiddenMarkers.map((item) => (
            <View key={item.id} style={[styles.row, styles.hiddenRow, { borderColor: colors.border }]}>
              <View style={styles.rowText}>
                <AppText color="muted" numberOfLines={1} variant="bodyMedium">
                  {item.title}
                </AppText>
                <AppText color="muted" numberOfLines={1} variant="caption">
                  {item.description}
                </AppText>
              </View>
              {iconButton(t("driverMap.showStop"), () => props.onToggleHidden(item.id, false), <Eye20Regular color={colors.primary} />)}
            </View>
          ))}
        </View>
      ) : null}
    </ScrollViewContainer>
  );
}

type OrderRowProps = {
  marker: MapCustomerMarker;
  number: number;
  hideButton: ReactNode;
  onPressPosition: () => void;
};

// Hold the row (or touch the handle) and drag it to a new position.
function OrderRow(props: OrderRowProps) {
  const { t } = useTranslation("admin");
  const colors = useThemeColors();
  const drag = useReorderableDrag();
  const isActive = useIsActive();

  return (
    <Pressable
      delayLongPress={250}
      onLongPress={drag}
      style={[styles.row, { borderColor: colors.border, backgroundColor: isActive ? colors.primaryMuted : colors.surface }]}
    >
      <Pressable
        accessibilityHint={t("route:manualOrder.positionHint")}
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
        <AppText color="muted" numberOfLines={1} variant="caption">
          {props.marker.description}
        </AppText>
      </View>
      {props.hideButton}
      <Pressable accessibilityLabel={t("route:manualOrder.dragHandle")} hitSlop={8} onPressIn={drag} style={styles.dragHandle}>
        <ReOrderDotsVertical20Regular color={colors.mutedText} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs, paddingBottom: spacing.md },
  section: { gap: spacing.xs, marginTop: spacing.xs },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
  headerTitle: { flex: 1 },
  pillButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hiddenRow: { opacity: 0.7 },
  index: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 2 },
  dragHandle: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  moveButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
