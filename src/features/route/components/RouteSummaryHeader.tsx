import { CheckmarkCircle20Regular } from "@fluentui/react-native-icons";
import { StyleSheet, View } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { RouteStop } from "@/src/features/route/types/routeTypes";
import { formatDistanceKm, formatEtaTime } from "@/src/features/route/utils/routeFormat";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type RouteSummaryHeaderProps = {
  totalCount: number;
  completedCount: number;
  lastStop: RouteStop | null;
};

export function RouteSummaryHeader(props: RouteSummaryHeaderProps) {
  const colors = useThemeColors();
  const arrivalLabel = props.lastStop
    ? `${formatEtaTime(props.lastStop.cumulativeEta)} - ${formatDistanceKm(props.lastStop.cumulativeDistanceKm)} كم`
    : null;

  return (
    <AppCard
      contentStyle={styles.card}
      frosted
      style={[
        styles.cardFrame,
        {
          backgroundColor: "#F6D9C5",
          borderColor: colors.primaryStrong,
          shadowColor: colors.primary,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.statsRow}>
          <View style={[styles.metricChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.primaryStrong }]}>
            <AppText color="primary" style={styles.metricValue} variant="label">
              {props.totalCount}
            </AppText>
          </View>
          <View style={[styles.metricChip, { backgroundColor: colors.successBackground, borderColor: colors.successBorder }]}>
            <AppText color="success" style={styles.metricValue} variant="label">
              {props.completedCount}
            </AppText>
          </View>
          {arrivalLabel ? (
            <View style={[styles.arrivalChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong }]}>
              <View style={[styles.smallIconBubble, { backgroundColor: colors.successBackground, borderColor: colors.successBorder }]}>
                <CheckmarkCircle20Regular color={colors.success} />
              </View>
              <AppText color="muted" numberOfLines={1} style={styles.arrivalText} variant="caption">
                {arrivalLabel}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  cardFrame: {
    borderRadius: radius.xl,
    padding: 2,
    borderWidth: 1,
  },
  card: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: spacing.xs },
  topRow: { flexDirection: "row", alignItems: "center" },
  smallIconBubble: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flex: 1, minWidth: 0, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "flex-start" },
  metricChip: {
    minWidth: 40,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 16,
    lineHeight: 18,
  },
  arrivalChip: {
    flexShrink: 1,
    maxWidth: 138,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  arrivalText: { flexShrink: 1, fontSize: 12 },
});
