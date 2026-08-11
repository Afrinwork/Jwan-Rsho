import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { MapNavigationApp, NavigationAppId } from "@/src/features/map/types/mapTypes";

type NavigationAppSheetProps = {
  visible: boolean;
  apps: MapNavigationApp[];
  onClose: () => void;
  onSelect: (appId: NavigationAppId) => void;
};

export function NavigationAppSheet({ visible, apps, onClose, onSelect }: NavigationAppSheetProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("map");

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t("navigationSheet.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>{t("navigationSheet.subtitle")}</Text>
          {apps.map((app) => (
            <View key={app.id}>
              <AppButton
                disabled={!app.available}
                label={app.available ? app.label : t("navigationSheet.unavailable", { label: app.label })}
                onPress={() => onSelect(app.id)}
                variant={app.id === "apple-maps" ? "primary" : "secondary"}
              />
            </View>
          ))}
          <AppButton label={t("common:close")} onPress={onClose} variant="secondary" />
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
  subtitle: { fontSize: 14, lineHeight: 20 },
});
