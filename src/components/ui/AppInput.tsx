import { ForwardedRef, forwardRef, useState } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { shadows } from "@/src/theme/shadows";
import { spacing } from "@/src/theme/spacing";
import { typography } from "@/src/theme/typography";

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
          backgroundColor: colors.surfaceMuted,
          borderColor: focused ? colors.primary : colors.border,
          color: colors.text,
          shadowColor: focused ? colors.primary : "transparent",
        },
        focused ? styles.focused : null,
        props.style,
      ]}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...typography.body,
    ...shadows.sm,
  },
  focused: {
    shadowOpacity: 0.16,
  },
});
