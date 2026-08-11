import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type SelectedCustomersBarProps = {
  selectedCount: number;
  sharing: boolean;
  emailing: boolean;
  shareError: string | null;
  onViewSelection: () => void;
  onShare: () => void;
  onShareByEmail: () => void;
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
          <AppButton label="Ansehen" onPress={props.onViewSelection} size="compact" variant="secondary" />
        </View>
        <View style={styles.actionButton}>
          <AppButton label="WhatsApp" loading={props.sharing} onPress={props.onShare} size="compact" />
        </View>
        <View style={styles.actionButton}>
          <AppButton label="E-Mail" loading={props.emailing} onPress={props.onShareByEmail} size="compact" variant="secondary" />
        </View>
        <View style={styles.actionButton}>
          <AppButton label="Loeschen" onPress={props.onResetSelection} size="compact" variant="secondary" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 14, padding: 10, gap: 6 },
  label: { fontSize: 13, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 6 },
  actionButton: { flex: 1 },
});
