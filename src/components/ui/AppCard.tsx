import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import { useAppTheme } from "@/src/hooks/useAppTheme";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { shadows } from "@/src/theme/shadows";
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
  const theme = useAppTheme();
  const palette = resolveTone(tone, colors);

  return (
    <View style={[styles.outer, { shadowColor: colors.shadow }, style]}>
      <View style={[styles.inner, { backgroundColor: palette.background, borderColor: palette.border }]}>
        {frosted ? (
          <BlurView
            intensity={theme === "dark" ? 24 : 36}
            style={StyleSheet.absoluteFillObject}
            tint={theme === "dark" ? "dark" : "light"}
          />
        ) : null}
        <LinearGradient
          colors={palette.gradient}
          end={{ x: 1, y: 0.8 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.highlight, { backgroundColor: palette.highlight }]} />
        <View style={[padded && styles.content, contentStyle]}>{children}</View>
      </View>
    </View>
  );
}

function resolveTone(tone: AppCardProps["tone"], colors: ReturnType<typeof useThemeColors>) {
  if (tone === "primary") {
    return {
      background: colors.primaryMuted,
      border: colors.border,
      gradient: ["rgba(255,255,255,0.6)", "rgba(255,255,255,0)"] as const,
      highlight: "rgba(255,255,255,0.48)",
    };
  }

  if (tone === "secondary") {
    return {
      background: colors.secondaryMuted,
      border: colors.border,
      gradient: ["rgba(255,255,255,0.46)", "rgba(255,255,255,0)"] as const,
      highlight: "rgba(255,255,255,0.3)",
    };
  }

  return {
    background: colors.surfaceElevated,
    border: colors.border,
    gradient: ["rgba(255,255,255,0.72)", "rgba(255,255,255,0)"] as const,
    highlight: "rgba(255,255,255,0.55)",
  };
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radius.card,
    ...shadows.md,
  },
  inner: {
    overflow: "hidden",
    borderRadius: radius.card,
    borderWidth: 1,
  },
  highlight: {
    position: "absolute",
    top: -36,
    right: -28,
    width: 132,
    height: 132,
    borderRadius: radius.pill,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
});
