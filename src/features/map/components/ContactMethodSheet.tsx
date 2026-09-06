import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type ContactMethodSheetProps = {
  visible: boolean;
  onClose: () => void;
  onCallPhone: () => void;
  onCallWhatsapp: () => void;
};

export function ContactMethodSheet({ visible, onClose, onCallPhone, onCallWhatsapp }: ContactMethodSheetProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("map");

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t("contactSheet.title")}</Text>
          <AppButton label={t("contactSheet.callPhone")} onPress={onCallPhone} />
          <AppButton label={t("contactSheet.callWhatsapp")} onPress={onCallWhatsapp} variant="secondary" />
          <AppButton label={t("common.close")} onPress={onClose} variant="secondary" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.28)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, padding: spacing.md, gap: spacing.sm },
  title: { fontSize: 18, fontWeight: "700" },
});
