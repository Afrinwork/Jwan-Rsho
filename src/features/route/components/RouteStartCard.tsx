import { Navigation20Regular, Search20Regular } from "@fluentui/react-native-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppInput } from "@/src/components/ui/AppInput";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { RouteTimeDropdown } from "@/src/features/route/components/RouteTimeDropdown";
import { routeT } from "@/src/features/route/i18n/routeT";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type RouteStartCardProps = {
  locationLabel: string;
  onLocationLabelChange: (value: string) => void;
  onSearchLocation: () => void;
  onUseCurrentLocation: () => void;
  geocoding: boolean;
  locationLoading: boolean;
  geocodeError: string | null;
  departureTimeText: string;
  onDepartureTimeChange: (value: string) => void;
};

export function RouteStartCard(props: RouteStartCardProps) {
  const t = routeT;
  const colors = useThemeColors();
  const resolvedLabel = props.locationLabel.trim();
  const selectedLocationLabel = resolvedLabel || t("startCard.currentLocationLabel");

  return (
    <AppCard
      contentStyle={styles.content}
      frosted
      style={[
        styles.cardFrame,
        {
          backgroundColor: "#F8E0CF",
          borderColor: colors.primaryStrong,
          shadowColor: colors.primary,
        },
      ]}
      tone="secondary"
    >
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <AppText color="primary" variant="label">
            {t("startCard.title")}
          </AppText>
          <AppText color="muted" numberOfLines={1} style={styles.locationLabel} variant="caption">
            {t("startCard.selectedLocation")}: {selectedLocationLabel}
          </AppText>
        </View>
        <View style={[styles.timePill, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryStrong }]}>
          <AppText color="muted" style={styles.timePillLabel} variant="caption">
            {t("startCard.departureTimeLabel")}
          </AppText>
          <AppText variant="label">{props.departureTimeText}</AppText>
        </View>
      </View>

      <View style={styles.inputHeader}>
        <AppText variant="subheading">{t("startCard.manualAddressTitle")}</AppText>
        <AppText color="muted" style={styles.helperText} variant="caption">
          {t("startCard.manualAddressHint")}
        </AppText>
      </View>

      <AppInput
        onChangeText={props.onLocationLabelChange}
        placeholder={t("startCard.locationPlaceholder")}
        value={props.locationLabel}
      />

      <View style={styles.actionRow}>
        <Pressable
          disabled={props.locationLoading}
          onPress={props.onUseCurrentLocation}
          style={({ pressed }) => [
            styles.iconAction,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.primaryStrong,
              opacity: props.locationLoading ? 0.55 : pressed ? 0.9 : 1,
            },
          ]}
        >
          <Navigation20Regular color={colors.primary} />
          <AppText style={styles.iconActionLabel} variant="caption">
            {t("startCard.useCurrentLocationShort")}
          </AppText>
        </Pressable>

        <Pressable
          disabled={props.geocoding}
          onPress={props.onSearchLocation}
          style={({ pressed }) => [
            styles.iconAction,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.primaryStrong,
              opacity: props.geocoding ? 0.55 : pressed ? 0.9 : 1,
            },
          ]}
        >
          <Search20Regular color={colors.primary} />
          <AppText style={styles.iconActionLabel} variant="caption">
            {t("startCard.searchLocationAction")}
          </AppText>
        </Pressable>

        <View style={[styles.timeInline, { backgroundColor: colors.surfaceElevated, borderColor: colors.primaryStrong }]}>
          <AppText color="muted" style={styles.timeInlineLabel} variant="caption">
            {t("startCard.departureTimeShort")}
          </AppText>
          <RouteTimeDropdown onChange={props.onDepartureTimeChange} value={props.departureTimeText} />
        </View>
      </View>

      <View style={styles.hintRow}>
        <View style={[styles.hintChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <AppText color="muted" style={styles.hintText} variant="caption">
            1. {t("startCard.stepAddress")}
          </AppText>
        </View>
        <View style={[styles.hintChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <AppText color="muted" style={styles.hintText} variant="caption">
            2. {t("startCard.stepConfirm")}
          </AppText>
        </View>
        <View style={[styles.hintChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <AppText color="muted" style={styles.hintText} variant="caption">
            3. {t("startCard.stepStart")}
          </AppText>
        </View>
      </View>

      {props.geocodeError ? <ErrorState message={props.geocodeError} /> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm },
  cardFrame: { borderRadius: radius.xl, padding: 2, borderWidth: 1 },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  titleRow: { flex: 1, gap: 2 },
  locationLabel: { flexShrink: 1 },
  inputHeader: { gap: 2 },
  helperText: { lineHeight: 18 },
  timePill: {
    minWidth: 78,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    alignItems: "center",
  },
  timePillLabel: { lineHeight: 14 },
  actionRow: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  iconAction: {
    width: 82,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 6,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
  },
  iconActionLabel: { fontWeight: "700", textAlign: "center" },
  timeInline: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  timeInlineLabel: { paddingHorizontal: 6 },
  hintRow: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  hintChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hintText: { fontWeight: "700" },
});
