import { StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type AppBadgeProps = {
  label: string;
  tone?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";
};

export function AppBadge({ label, tone = "neutral" }: AppBadgeProps) {
  const colors = useThemeColors();
  const palette = resolveBadgeTone(tone, colors);

  return (
    <View style={[styles.badge, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <AppText color={palette.text} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function resolveBadgeTone(tone: AppBadgeProps["tone"], colors: ReturnType<typeof useThemeColors>) {
  switch (tone) {
    case "primary":
      return { background: colors.primaryMuted, border: colors.border, text: colors.primary };
    case "secondary":
      return { background: colors.secondaryMuted, border: colors.border, text: colors.secondary };
    case "success":
      return { background: colors.successBackground, border: colors.successBorder, text: colors.success };
    case "warning":
      return { background: colors.warningBackground, border: colors.warningBorder, text: colors.warning };
    case "danger":
      return { background: colors.dangerBackground, border: colors.dangerBorder, text: colors.danger };
    default:
      return { background: colors.surfaceMuted, border: colors.border, text: colors.textSecondary };
  }
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
});
