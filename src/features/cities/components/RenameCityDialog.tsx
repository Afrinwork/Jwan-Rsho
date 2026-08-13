import { useEffect, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppInput } from "@/src/components/ui/AppInput";
import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/theme/spacing";

type RenameCityDialogProps = {
  visible: boolean;
  currentName: string;
  saving?: boolean;
  onCancel: () => void;
  onSave: (newName: string) => void;
};

export function RenameCityDialog({ visible, currentName, saving, onCancel, onSave }: RenameCityDialogProps) {
  const { t } = useTranslation("cities");
  const [value, setValue] = useState(currentName);

  useEffect(() => {
    if (visible) {
      setValue(currentName);
    }
  }, [visible, currentName]);

  const trimmed = value.trim();

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <AppCard contentStyle={styles.card} frosted>
          <AppText variant="heading">{t("rename.title")}</AppText>
          <AppInput autoFocus onChangeText={setValue} value={value} />
          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <AppButton label={t("common:cancel")} onPress={onCancel} variant="secondary" />
            </View>
            <View style={styles.actionButton}>
              <AppButton
                disabled={!trimmed || trimmed === currentName.trim()}
                label={t("rename.save")}
                loading={saving}
                onPress={() => onSave(trimmed)}
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
