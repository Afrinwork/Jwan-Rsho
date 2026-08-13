import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { Search20Regular } from "@fluentui/react-native-icons";
import { useTranslation } from "react-i18next";

import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { shadows } from "@/src/theme/shadows";
import { spacing } from "@/src/theme/spacing";
import { typography } from "@/src/theme/typography";

export function SearchInput(props: TextInputProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("common");

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceMuted, borderColor: colors.border, shadowColor: colors.shadow },
      ]}
    >
      <Search20Regular color={colors.mutedText} />
      <TextInput
        placeholder={t("search")}
        placeholderTextColor={colors.mutedText}
        {...props}
        style={[styles.input, { color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
  },
});
