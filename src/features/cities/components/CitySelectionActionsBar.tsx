import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/theme/spacing";

type CitySelectionActionsBarProps = {
  selectedCount: number;
  sharing: boolean;
  emailing: boolean;
  completingAll: boolean;
  actionError: string | null;
  onShare: () => void;
  onShareByEmail: () => void;
  onCompleteAll: () => void;
};

export function CitySelectionActionsBar(props: CitySelectionActionsBarProps) {
  const { t } = useTranslation("cities");

  if (props.selectedCount === 0) {
    return null;
  }

  return (
    <AppCard contentStyle={styles.container} frosted>
      <AppText style={styles.title} variant="caption">
        {t("selectionActions.title")}
      </AppText>
      {props.actionError ? <ErrorState durationMs={4200} message={props.actionError} /> : null}
      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <AppButton label={t("selectionActions.whatsapp")} loading={props.sharing} onPress={props.onShare} size="compact" />
        </View>
        <View style={styles.actionButton}>
          <AppButton label={t("selectionActions.email")} loading={props.emailing} onPress={props.onShareByEmail} size="compact" variant="secondary" />
        </View>
        <View style={styles.actionButton}>
          <AppButton label={t("selectionActions.completeAll")} loading={props.completingAll} onPress={props.onCompleteAll} size="compact" variant="secondary" />
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  actionButton: {
    flex: 1,
    minWidth: "31%",
  },
});
