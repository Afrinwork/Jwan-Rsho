import {
  ArrowDown20Regular,
  ArrowReset20Regular,
  ArrowUp20Regular,
  Eye20Regular,
  EyeOff20Regular,
} from "@fluentui/react-native-icons";
import { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
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
// sorting controls as the driver's route list (tap the number / arrows),
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
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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

      {props.markers.map((item, index) => (
        <View key={item.id} style={[styles.row, { borderColor: colors.border }]}>
          <Pressable
            accessibilityHint={t("route:manualOrder.positionHint")}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => props.onPressPosition(item.id)}
            style={[styles.index, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}
          >
            <AppText color="primary" variant="label">
              {index + 1}
            </AppText>
          </Pressable>
          <View style={styles.rowText}>
            <AppText numberOfLines={1} variant="bodyMedium">
              {item.title}
            </AppText>
            <AppText color="muted" numberOfLines={1} variant="caption">
              {item.description}
            </AppText>
          </View>
          {index > 0
            ? iconButton(t("route:manualOrder.moveUp"), () => props.onMove(item.id, index), <ArrowUp20Regular color={colors.primary} />)
            : null}
          {index < props.markers.length - 1
            ? iconButton(t("route:manualOrder.moveDown"), () => props.onMove(item.id, index + 2), <ArrowDown20Regular color={colors.primary} />)
            : null}
          {iconButton(t("driverMap.hideStop"), () => props.onToggleHidden(item.id, true), <EyeOff20Regular color={colors.mutedText} />)}
        </View>
      ))}

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
    </ScrollView>
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
  moveButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
