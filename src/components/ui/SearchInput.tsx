import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { Search20Regular } from "@fluentui/react-native-icons";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

export function SearchInput(props: TextInputProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border, shadowColor: colors.shadow },
      ]}
    >
      <Search20Regular color={colors.mutedText} />
      <TextInput
        placeholder="Suchen"
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
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
});
