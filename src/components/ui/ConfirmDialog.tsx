import { Modal, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

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
  confirmLabel = "Bestaetigen",
  cancelLabel = "Abbrechen",
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const colors = useThemeColors();

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.mutedText }]}>{message}</Text>
          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <AppButton label={cancelLabel} onPress={onCancel} variant="secondary" />
            </View>
            <View style={styles.actionButton}>
              <AppButton
                label={confirmLabel}
                onPress={onConfirm}
                variant={destructive ? "danger" : "primary"}
              />
            </View>
          </View>
        </View>
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
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
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
