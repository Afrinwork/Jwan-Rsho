import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

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
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <CompactScreenHeader subtitle="Kunden und Filter direkt auf der Karte." title="Karte" />
      {props.locationError ? (
        <View style={styles.banner}>
          <ErrorState message={props.locationError} />
          {props.locationPermissionDenied ? (
            <AppButton label="Erneut fragen" onPress={props.onRetryLocation} variant="secondary" />
          ) : null}
        </View>
      ) : null}
      {props.customersError ? (
        <View style={styles.banner}>
          <ErrorState message={props.customersError} />
          <AppButton label="Kunden neu laden" onPress={props.onRetryCustomers} variant="secondary" />
        </View>
      ) : null}
      {props.customersLoading ? (
        <View style={[styles.statusCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.statusText, { color: colors.mutedText }]}>Kundenpins werden geladen...</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  banner: { gap: spacing.sm },
  statusCard: { borderWidth: 1, borderRadius: 16, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  statusText: { fontSize: 14 },
});
