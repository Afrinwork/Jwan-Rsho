import { ForwardedRef, forwardRef } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

import { colors } from "@/src/constants/colors";
import { spacing } from "@/src/constants/spacing";

export const AppInput = forwardRef(function AppInput(
  props: TextInputProps,
  ref: ForwardedRef<TextInput>,
) {
  return <TextInput placeholderTextColor={colors.mutedText} ref={ref} style={styles.input} {...props} />;
});

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
});
