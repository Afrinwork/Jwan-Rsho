import { StyleSheet, View } from "react-native";
import { mapT } from "@/src/features/map/i18n/mapT";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/theme/spacing";

type MapToolbarProps = {
  locationError: string | null;
  customersError: string | null;
  locationPermissionDenied: boolean;
  customersLoading: boolean;
  filteredCount: number;
  onRetryLocation: () => void;
  onRetryCustomers: () => void;
};

export function MapToolbar(props: MapToolbarProps) {
  const t = mapT;

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
        <AppCard contentStyle={styles.statusCard} frosted>
          <AppText color="muted" variant="body">
            {t("toolbar.loadingCustomers")}
          </AppText>
        </AppCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  banner: { gap: spacing.sm },
  statusCard: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
});
