import { ReactNode } from "react";
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from "react-native";

import { useThemeColors } from "@/src/hooks/useThemeColors";
import { typography, TypographyVariant } from "@/src/theme/typography";

type AppTextColor = "default" | "secondary" | "muted" | "primary" | "success" | "warning" | "danger";

type AppTextProps = TextProps & {
  children: ReactNode;
  variant?: TypographyVariant;
  color?: AppTextColor | string;
  style?: StyleProp<TextStyle>;
};

export function AppText({
  children,
  variant = "body",
  color = "default",
  style,
  ...props
}: AppTextProps) {
  const colors = useThemeColors();

  return (
    <Text
      {...props}
      style={[
        styles.base,
        typography[variant],
        { color: resolveTextColor(color, colors) },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

function resolveTextColor(color: AppTextProps["color"], colors: ReturnType<typeof useThemeColors>) {
  switch (color) {
    case "secondary":
      return colors.textSecondary;
    case "muted":
      return colors.textMuted;
    case "primary":
      return colors.primary;
    case "success":
      return colors.success;
    case "warning":
      return colors.warning;
    case "danger":
      return colors.danger;
    case "default":
    case undefined:
      return colors.text;
    default:
      return color;
  }
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
