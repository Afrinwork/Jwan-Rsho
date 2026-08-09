import { ForwardedRef, forwardRef, useState } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

export const AppInput = forwardRef(function AppInput(
  props: TextInputProps,
  ref: ForwardedRef<TextInput>,
) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      {...props}
      onBlur={(event) => {
        setFocused(false);
        props.onBlur?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        props.onFocus?.(event);
      }}
      placeholderTextColor={colors.mutedText}
      ref={ref}
      style={[
        styles.input,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: focused ? colors.primary : colors.border,
          color: colors.text,
          shadowColor: focused ? colors.shadow : "transparent",
        },
      ]}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
});
