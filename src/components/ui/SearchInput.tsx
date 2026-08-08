import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

export function SearchInput(props: TextInputProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Ionicons color={colors.mutedText} name="search-outline" size={18} />
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
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
});
