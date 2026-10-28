import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/theme/spacing";

export type ConfirmPanelProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// The question and its two buttons without a Modal of their own — used
// inside an already open sheet, where a second Modal on top (or one opening
// while the sheet closes) leaves an invisible overlay that freezes the app.
export function ConfirmPanel({ title, message, confirmLabel, cancelLabel, destructive, onConfirm, onCancel }: ConfirmPanelProps) {
  const { t } = useTranslation("common");

  return (
    <View style={styles.container}>
      <AppText variant="heading">{title}</AppText>
      <AppText color="muted" variant="body">
        {message}
      </AppText>
      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <AppButton label={cancelLabel ?? t("cancel")} onPress={onCancel} variant="secondary" />
        </View>
        <View style={styles.actionButton}>
          <AppButton label={confirmLabel ?? t("confirm")} onPress={onConfirm} variant={destructive ? "danger" : "primary"} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
