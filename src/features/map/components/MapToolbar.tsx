import { Pressable, StyleSheet, View } from "react-native";
import { mapT } from "@/src/features/map/i18n/mapT";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { spacing } from "@/src/theme/spacing";

type MapToolbarProps = {
  locationError: string | null;
  customersError: string | null;
  locationPermissionDenied: boolean;
  customersLoading: boolean;
  filteredCount: number;
  openOrdersCount: number;
  customersCount: number;
  needsAddressCheckCount: number;
  onRetryLocation: () => void;
  onRetryCustomers: () => void;
  onOpenAddressCheck: () => void;
};

export function MapToolbar(props: MapToolbarProps) {
  const t = mapT;
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {props.locationError ? (
        <View style={styles.banner}>
          <ErrorState message={props.locationError} />
          {props.locationPermissionDenied ? (
            <AppButton label={t("toolbar.retryLocation")} onPress={props.onRetryLocation} variant="secondary" />
          ) : null}
        </View>
      ) : null}
      {props.customersError ? (
        <View style={styles.banner}>
          <ErrorState message={props.customersError} />
          <AppButton label={t("toolbar.retryCustomers")} onPress={props.onRetryCustomers} variant="secondary" />
        </View>
      ) : null}
      {props.customersLoading ? (
        <View style={styles.statusRow}>
          <AppText color="muted" variant="body">
            {t("toolbar.loadingCustomers")}
          </AppText>
        </View>
      ) : (
        <View style={[styles.statusRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText color="muted" variant="caption">
              {t("toolbar.diagnostics", {
                openOrders: props.openOrdersCount,
                customers: props.customersCount,
                markers: props.filteredCount,
              })}
            </AppText>
            {props.needsAddressCheckCount > 0 ? (
              <Pressable onPress={props.onOpenAddressCheck}>
                <AppText color="warning" variant="caption">
                  {t("toolbar.needsAddressCheck", { count: props.needsAddressCheckCount })}
                </AppText>
              </Pressable>
            ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  banner: { gap: spacing.sm },
  statusRow: { alignItems: "center", borderRadius: 8, borderWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, minHeight: 40, paddingHorizontal: spacing.sm },
});
