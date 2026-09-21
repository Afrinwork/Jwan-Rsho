import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { spacing } from "@/src/constants/spacing";
import { radius } from "@/src/theme/radius";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type UserActionSheetProps = {
  visible: boolean;
  userName: string;
  isActive: boolean;
  onClose: () => void;
  onSelectEdit: () => void;
  onSelectToggleActive: () => void;
  onSelectDelete: () => void;
};

// Menu opened from a driver/admin dashboard row — routes to whichever action
// the calling screen owns next (edit opens a form, deactivate/reactivate and
// delete route to their own confirm dialogs with different styling).
export function UserActionSheet({
  visible,
  userName,
  isActive,
  onClose,
  onSelectEdit,
  onSelectToggleActive,
  onSelectDelete,
}: UserActionSheetProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("admin");

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{userName}</Text>
          <AppButton label={t("userActions.edit")} onPress={onSelectEdit} variant="secondary" />
          <AppButton
            label={isActive ? t("userActions.deactivate") : t("userActions.reactivate")}
            onPress={onSelectToggleActive}
            variant="secondary"
          />
          <AppButton label={t("userActions.delete")} onPress={onSelectDelete} variant="danger" />
          <AppButton label={t("userActions.cancel")} onPress={onClose} size="compact" variant="secondary" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.28)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.xs,
  },
});
