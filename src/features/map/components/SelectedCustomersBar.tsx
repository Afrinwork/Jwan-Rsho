import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type SelectedCustomersBarProps = {
  selectedCount: number;
  sharing: boolean;
  shareError: string | null;
  onViewSelection: () => void;
  onShare: () => void;
  onResetSelection: () => void;
};

export function SelectedCustomersBar(props: SelectedCustomersBarProps) {
  const colors = useThemeColors();

  if (props.selectedCount === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.text }]}>{props.selectedCount} Kunden ausgewaehlt</Text>
      {props.shareError ? <ErrorState message={props.shareError} /> : null}
      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <AppButton label="Auswahl ansehen" onPress={props.onViewSelection} variant="secondary" />
        </View>
        <View style={styles.actionButton}>
          <AppButton label="Teilen" loading={props.sharing} onPress={props.onShare} />
        </View>
        <View style={styles.actionButton}>
          <AppButton label="Auswahl loeschen" onPress={props.onResetSelection} variant="secondary" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 20, padding: spacing.md, gap: spacing.sm },
  label: { fontSize: 16, fontWeight: "700" },
  actions: { flexDirection: "row", gap: spacing.sm },
  actionButton: { flex: 1 },
});
