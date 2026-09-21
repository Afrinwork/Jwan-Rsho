import { useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { FormField } from "@/src/components/forms/FormField";
import { spacing } from "@/src/constants/spacing";
import { radius } from "@/src/theme/radius";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type EditUserSheetProps = {
  visible: boolean;
  initialFullName: string;
  initialEmail: string;
  saving: boolean;
  error: string | null;
  onSave: (values: { fullName: string; email: string }) => void;
  onClose: () => void;
};

export function EditUserSheet({
  visible,
  initialFullName,
  initialEmail,
  saving,
  error,
  onSave,
  onClose,
}: EditUserSheetProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("admin");
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  // Resets the form whenever a different target opens (or the same target's
  // stored values change after a save) — adjusted directly during render,
  // React's documented pattern for "reset state when a prop changes",
  // matching the convention already used elsewhere in this codebase.
  const [trackedInitial, setTrackedInitial] = useState({ fullName: initialFullName, email: initialEmail });

  if (trackedInitial.fullName !== initialFullName || trackedInitial.email !== initialEmail) {
    setTrackedInitial({ fullName: initialFullName, email: initialEmail });
    setFullName(initialFullName);
    setEmail(initialEmail);
  }

  const canSave = fullName.trim().length > 0 && email.trim().length > 0 && !saving;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t("editUserSheet.title")}</Text>
          {error ? <ErrorState message={error} /> : null}
          <FormField label={t("createUser.fullNameLabel")}>
            <AppInput onChangeText={setFullName} value={fullName} />
          </FormField>
          <FormField label={t("createUser.emailLabel")}>
            <AppInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} value={email} />
          </FormField>
          <AppButton
            label={saving ? t("editUserSheet.saving") : t("editUserSheet.save")}
            loading={saving}
            onPress={() => onSave({ fullName: fullName.trim(), email: email.trim() })}
            disabled={!canSave}
          />
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
    marginBottom: spacing.xs,
  },
});
