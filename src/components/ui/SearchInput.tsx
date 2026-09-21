import { I18nManager, Pressable, StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { Dismiss20Regular, Search20Regular } from "@fluentui/react-native-icons";
import { useTranslation } from "react-i18next";

import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";
import { typography } from "@/src/theme/typography";

export function SearchInput(props: TextInputProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("common");

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceMuted, borderColor: colors.border, flexDirection: I18nManager.isRTL ? "row-reverse" : "row" },
      ]}
    >
      <Search20Regular color={colors.mutedText} />
      <TextInput
        placeholder={t("search")}
        placeholderTextColor={colors.mutedText}
        {...props}
        style={[styles.input, { color: colors.text, textAlign: I18nManager.isRTL ? "right" : "left" }]}
      />
      {props.value ? (
        <Pressable accessibilityLabel={t("close")} hitSlop={8} onPress={() => props.onChangeText?.("")} style={styles.clearButton}>
          <Dismiss20Regular color={colors.mutedText} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    paddingVertical: spacing.xs,
  },
  input: {
    flex: 1,
    ...typography.body,
  },
  clearButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
});
