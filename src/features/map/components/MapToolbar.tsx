import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
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
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Karte</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Standardmaessig siehst du Kunden mit offenen Bestellungen und gueltigen Koordinaten.
        </Text>
      </View>
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
        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statusText, { color: colors.mutedText }]}>Kundenpins werden geladen...</Text>
        </View>
      ) : null}
      <View style={[styles.footerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.footerTitle, { color: colors.text }]}>{props.filteredCount} Kunden auf der Karte</Text>
        <Text style={[styles.footerSubtitle, { color: colors.mutedText }]}>
          Kunden ohne Koordinaten werden uebersprungen und blockieren die Karte nicht.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  card: { borderWidth: 1, borderRadius: 20, padding: spacing.md, gap: spacing.xs },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 14, lineHeight: 20 },
  banner: { gap: spacing.sm },
  statusCard: { borderWidth: 1, borderRadius: 16, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  statusText: { fontSize: 14 },
  footerCard: { borderWidth: 1, borderRadius: 20, padding: spacing.md, gap: spacing.xs },
  footerTitle: { fontSize: 16, fontWeight: "700" },
  footerSubtitle: { fontSize: 13, lineHeight: 18 },
});
