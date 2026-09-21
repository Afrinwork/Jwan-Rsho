import { ChevronDown20Regular, ChevronUp20Regular, MapDrive20Regular } from "@fluentui/react-native-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { DriverDashboardDetails } from "@/src/features/admin/components/DriverDashboardDetails";
import { DriverWithStats } from "@/src/features/admin/hooks/useOwnDriversWithStats";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { spacing } from "@/src/theme/spacing";

type DriverDashboardCardProps = {
  entry: DriverWithStats;
  busy: boolean;
  expanded: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onOpenDriverView: () => void;
  onToggleActive: () => void;
  onToggleExpanded: () => void;
};

export function DriverDashboardCard(props: DriverDashboardCardProps) {
  const { t } = useTranslation("admin");
  const colors = useThemeColors();
  const isActive = props.entry.driver.isActive !== false;
  const hasCheckIn = props.entry.checkIn?.status === "ok";
  const canOpenDriverView = props.entry.assignedCustomerIds.length > 0;
  const status = !isActive
    ? t("userActions.inactiveBadge")
    : hasCheckIn
      ? t("driverDashboard.checkInOk")
      : t("driverDashboard.checkInMissing");

  return (
    <AppCard contentStyle={styles.card}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={props.onToggleExpanded} style={({ pressed }) => [styles.expandTrigger, pressed && styles.pressed]}>
          <View style={styles.copy}>
            <AppText numberOfLines={1} variant="subheading">
              {props.entry.driver.fullName}
            </AppText>
            <AppText color={!isActive ? "danger" : hasCheckIn ? "success" : "muted"} numberOfLines={1} variant="caption">
              {status} - {t("driverDashboard.openLabel")}: {props.entry.openCount}
            </AppText>
          </View>
          {props.expanded ? <ChevronUp20Regular color={colors.mutedText} /> : <ChevronDown20Regular color={colors.mutedText} />}
        </Pressable>
        <Pressable
          accessibilityLabel={t("driverDashboard.openDriverView")}
          disabled={!canOpenDriverView}
          onPress={props.onOpenDriverView}
          style={[styles.mapButton, { backgroundColor: colors.surfaceMuted, borderColor: colors.border, opacity: canOpenDriverView ? 1 : 0.45 }]}
        >
          <MapDrive20Regular color={canOpenDriverView ? colors.primary : colors.mutedText} />
        </Pressable>
      </View>
      {props.expanded ? <DriverDashboardDetails {...props} /> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, padding: spacing.md },
  header: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 52 },
  expandTrigger: { alignItems: "center", flex: 1, flexDirection: "row", gap: spacing.sm, minHeight: 52 },
  copy: { flex: 1, gap: 2 },
  mapButton: { alignItems: "center", borderRadius: 8, borderWidth: 1, height: 40, justifyContent: "center", width: 40 },
  pressed: { opacity: 0.72 },
});
