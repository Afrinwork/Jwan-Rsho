import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type AppCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  tone?: "surface" | "primary" | "secondary";
  padded?: boolean;
  frosted?: boolean;
}>;

export function AppCard({
  children,
  style,
  contentStyle,
  tone = "surface",
  padded = true,
  frosted = false,
}: AppCardProps) {
  const colors = useThemeColors();
  const palette = resolveTone(tone, colors);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: frosted ? colors.surfaceMuted : palette.background,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <View style={[padded && styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

function resolveTone(tone: AppCardProps["tone"], colors: ReturnType<typeof useThemeColors>) {
  if (tone === "primary") {
    return { background: colors.primaryMuted, border: colors.border };
  }

  if (tone === "secondary") {
    return { background: colors.secondaryMuted, border: colors.border };
  }

  return { background: colors.surfaceElevated, border: colors.border };
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: "hidden",
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
});
