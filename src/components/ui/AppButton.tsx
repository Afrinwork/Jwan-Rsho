import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";
import { typography } from "@/src/theme/typography";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "medium" | "compact";
};

export function AppButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
  size = "medium",
}: AppButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;
  const isSecondary = variant === "secondary";
  const backgroundColor = isSecondary
    ? colors.surfaceElevated
    : variant === "danger"
      ? colors.danger
      : variant === "success"
        ? colors.success
        : colors.primary;
  const borderColor = isSecondary ? colors.borderStrong : backgroundColor;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === "compact" && styles.compact,
        {
          backgroundColor,
          borderColor,
          opacity: isDisabled ? 0.55 : pressed ? 0.84 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.primary : colors.primaryContrast} />
      ) : (
        <AppText
          numberOfLines={1}
          style={[styles.label, size === "compact" && styles.compactLabel, { color: isSecondary ? colors.text : colors.primaryContrast }]}
          variant="bodyMedium"
        >
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radius.button,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  compact: {
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  label: {
    textAlign: "center",
  },
  compactLabel: {
    ...typography.label,
  },
});
