import { ForwardedRef, forwardRef, useState } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
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
          backgroundColor: colors.surfaceElevated,
          borderColor: focused ? colors.primary : colors.border,
          color: colors.text,
        },
        props.style,
      ]}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radius.input,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
});
