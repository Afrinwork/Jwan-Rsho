import { Location20Regular } from "@fluentui/react-native-icons";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { DriverWithStats } from "@/src/features/admin/hooks/useOwnDriversWithStats";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type DriverDashboardDetailsProps = {
  entry: DriverWithStats;
  busy: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onOpenDriverView: () => void;
  onToggleActive: () => void;
};

export function DriverDashboardDetails({
  entry,
  busy,
  onDelete,
  onEdit,
  onOpenDriverView,
  onToggleActive,
}: DriverDashboardDetailsProps) {
  const { t } = useTranslation("admin");
  const colors = useThemeColors();
  const isActive = entry.driver.isActive !== false;
  const canOpenDriverView = entry.assignedCustomerIds.length > 0;

  return (
    <View style={styles.content}>
      <View style={styles.metrics}>
        <Metric label={t("driverDashboard.openLabel")} value={entry.openCount} />
        <Metric label={t("driverDashboard.completedLabel")} value={entry.completedToday} />
        <Metric label={t("driverDashboard.notDoneLabel")} value={entry.notDoneCount} />
      </View>
      <View
        style={[styles.location, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
      >
        <Location20Regular color={colors.mutedText} />
        <View style={styles.locationCopy}>
          <AppText numberOfLines={2} variant="bodyMedium">
            {entry.checkIn?.address ?? t("driverDashboard.noAddress")}
          </AppText>
          <AppText color="muted" variant="caption">
            {formatDriverMeta(entry, t)}
          </AppText>
        </View>
      </View>
      <View style={[styles.report, { borderColor: colors.border }]}>
        <AppText variant="label">{t("driverDashboard.lastReport")}</AppText>
        <InfoRow label={t("driverDashboard.addressLabel")} value={entry.checkIn?.address ?? t("driverDashboard.noAddress")} />
        <InfoRow label={t("driverDashboard.odometerLabel")} value={formatOdometer(entry, t)} />
        <InfoRow label={t("driverDashboard.reportedAtLabel")} value={formatReportedAt(entry, t)} />
        <InfoRow label={t("driverDashboard.gpsAccuracyLabel")} value={formatAccuracy(entry, t)} />
        <InfoRow label={t("driverDashboard.assignedCustomersLabel")} value={String(entry.assignedCustomerIds.length)} />
      </View>
      <AppButton
        disabled={!canOpenDriverView}
        label={canOpenDriverView ? t("driverDashboard.openDriverView") : t("driverDashboard.noDriverView")}
        onPress={onOpenDriverView}
        size="compact"
        variant="secondary"
      />
      <View style={styles.actions}>
        <View style={styles.action}>
          <AppButton label={t("userActions.edit")} onPress={onEdit} size="compact" variant="secondary" />
        </View>
        <View style={styles.action}>
          <AppButton
            label={isActive ? t("driverDashboard.blockDriver") : t("driverDashboard.unblockDriver")}
            loading={busy}
            onPress={onToggleActive}
            size="compact"
            variant="secondary"
          />
        </View>
      </View>
      <AppButton label={t("userActions.delete")} loading={busy} onPress={onDelete} size="compact" variant="danger" />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <AppText variant="heading">{value}</AppText>
      <AppText color="muted" numberOfLines={1} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText color="muted" style={styles.infoLabel} variant="caption">{label}</AppText>
      <AppText style={styles.infoValue} variant="caption">{value}</AppText>
    </View>
  );
}

function formatDriverMeta(entry: DriverWithStats, t: ReturnType<typeof useTranslation>["t"]) {
  const odometer = formatOdometer(entry, t);
  if (!entry.checkIn?.updatedAt) return `${odometer} - ${t("driverDashboard.noUpdate")}`;
  const updated = new Date(entry.checkIn.updatedAt);
  const time = Number.isNaN(updated.getTime())
    ? t("driverDashboard.noUpdate")
    : updated.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${odometer} - ${time}`;
}

function formatOdometer(entry: DriverWithStats, t: ReturnType<typeof useTranslation>["t"]) {
  return Number.isFinite(entry.checkIn?.odometerKm)
    ? `${Math.round(entry.checkIn?.odometerKm ?? 0)} km`
    : t("driverDashboard.noOdometer");
}

function formatReportedAt(entry: DriverWithStats, t: ReturnType<typeof useTranslation>["t"]) {
  const updatedAt = entry.checkIn?.updatedAt;
  if (!updatedAt) return t("driverDashboard.noUpdate");
  const date = new Date(updatedAt);
  return Number.isNaN(date.getTime())
    ? t("driverDashboard.noUpdate")
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatAccuracy(entry: DriverWithStats, t: ReturnType<typeof useTranslation>["t"]) {
  return Number.isFinite(entry.checkIn?.gpsAccuracy)
    ? `${Math.round(entry.checkIn?.gpsAccuracy ?? 0)} m`
    : t("driverDashboard.noGpsAccuracy");
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm },
  metrics: { flexDirection: "row", gap: spacing.sm },
  metric: { flex: 1, minWidth: 0 },
  location: {
    alignItems: "flex-start",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  locationCopy: { flex: 1, gap: 2 },
  report: { borderTopWidth: 1, gap: spacing.xs, paddingTop: spacing.sm },
  infoRow: { flexDirection: "row", gap: spacing.sm },
  infoLabel: { flexBasis: "42%" },
  infoValue: { flex: 1, textAlign: "right" },
  actions: { flexDirection: "row", gap: spacing.sm },
  action: { flex: 1 },
});
