import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

export type WhatsappTemplateLanguage = "de" | "ar";

type WhatsappLanguageTabsProps = {
  active: WhatsappTemplateLanguage;
  onChange: (value: WhatsappTemplateLanguage) => void;
};

// Same segmented-tab visual language as CustomerListTabs -- switches which
// of the two independent template texts (German/Arabic) the editor below
// is currently showing.
export function WhatsappLanguageTabs({ active, onChange }: WhatsappLanguageTabsProps) {
  const { t } = useTranslation("management");
  const colors = useThemeColors();

  return (
    <View style={[styles.tabs, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <LanguageTab active={active === "de"} label={t("whatsappTemplate.tabDe")} onPress={() => onChange("de")} />
      <LanguageTab active={active === "ar"} label={t("whatsappTemplate.tabAr")} onPress={() => onChange("ar")} />
    </View>
  );
}

function LanguageTab({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        {
          backgroundColor: active ? colors.surfaceElevated : "transparent",
          borderColor: active ? colors.borderStrong : "transparent",
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <AppText color={active ? "default" : "muted"} numberOfLines={1} style={styles.tabLabel} variant="label">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: {
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  tab: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  tabLabel: {
    textAlign: "center",
  },
});
