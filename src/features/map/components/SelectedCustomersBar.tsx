import { StyleSheet, View } from "react-native";
import { mapT } from "@/src/features/map/i18n/mapT";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/theme/spacing";

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
  const t = mapT;

  if (props.selectedCount === 0) {
    return null;
  }

  return (
    <AppCard contentStyle={styles.container} frosted>
      <AppText variant="label">{t("selectedBar.count", { count: props.selectedCount })}</AppText>
      {props.shareError ? <ErrorState message={props.shareError} /> : null}
      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <AppButton label={t("selectedBar.view")} onPress={props.onViewSelection} size="compact" variant="secondary" />
        </View>
        <View style={styles.actionButton}>
          <AppButton label={t("selectedBar.whatsapp")} loading={props.sharing} onPress={props.onShare} size="compact" />
        </View>
        <View style={styles.actionButton}>
          <AppButton label={t("selectedBar.email")} loading={props.emailing} onPress={props.onShareByEmail} size="compact" variant="secondary" />
        </View>
        <View style={styles.actionButton}>
          <AppButton label={t("selectedBar.clear")} onPress={props.onResetSelection} size="compact" variant="secondary" />
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.sm, gap: spacing.xs },
  actions: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  actionButton: { flex: 1, minWidth: "47%" },
});
