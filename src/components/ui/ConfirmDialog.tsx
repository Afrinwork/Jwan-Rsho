import { Modal, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { spacing } from "@/src/theme/spacing";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("common");

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <AppCard contentStyle={styles.card} frosted style={{ backgroundColor: colors.surfaceElevated }}>
          <AppText variant="heading">{title}</AppText>
          <AppText color="muted" variant="body">
            {message}
          </AppText>
          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <AppButton label={cancelLabel ?? t("cancel")} onPress={onCancel} variant="secondary" />
            </View>
            <View style={styles.actionButton}>
              <AppButton
                label={confirmLabel ?? t("confirm")}
                onPress={onConfirm}
                variant={destructive ? "danger" : "primary"}
              />
            </View>
          </View>
        </AppCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    padding: spacing.lg,
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
