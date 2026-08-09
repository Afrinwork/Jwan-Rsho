import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
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
  const compact = size === "compact";

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        {
          backgroundColor: variant === "secondary" ? colors.surface : variant === "danger" ? colors.danger : colors.primary,
          borderColor: variant === "secondary" ? colors.borderStrong : variant === "danger" ? colors.danger : colors.primaryStrong,
          opacity: isDisabled ? 0.55 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.99 : 1 }],
          shadowColor: colors.shadow,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? colors.primary : colors.primaryContrast} />
      ) : (
        <Text
          numberOfLines={compact ? 1 : undefined}
          style={[styles.label, compact && styles.labelCompact, { color: variant === "secondary" ? colors.text : colors.primaryContrast }]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  buttonCompact: {
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  labelCompact: {
    fontSize: 13,
  },
});
