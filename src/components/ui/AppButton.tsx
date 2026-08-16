import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { shadows } from "@/src/theme/shadows";
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
  const compact = size === "compact";

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => {
        const backgroundColor =
          variant === "secondary"
            ? colors.surfaceMuted
            : variant === "danger"
              ? colors.danger
              : variant === "success"
                ? colors.success
                : colors.primary;
        const borderColor =
          variant === "secondary"
            ? colors.border
            : variant === "danger"
              ? colors.danger
              : variant === "success"
                ? colors.success
                : colors.primaryStrong;

        return [
          styles.button,
          compact && styles.buttonCompact,
          {
            backgroundColor,
            borderColor,
            opacity: isDisabled ? 0.55 : 1,
            transform: [{ scale: pressed && !isDisabled ? 0.985 : 1 }],
            shadowColor: variant === "primary" || variant === "success" ? backgroundColor : colors.shadow,
          },
          pressed && !isDisabled ? styles.buttonPressed : null,
        ];
      }}
    >
      {variant === "secondary" ? <View style={[styles.secondaryFill, { backgroundColor: colors.surfaceMuted }]} /> : null}
      {variant !== "secondary" ? (
        <LinearGradient
          colors={
            variant === "danger"
              ? [colors.danger, "#D92D20"]
              : variant === "success"
                ? [colors.success, "#039855"]
                : [colors.primary, colors.primaryStrong]
          }
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? colors.primary : colors.primaryContrast} />
      ) : (
        <AppText
          numberOfLines={compact ? 1 : undefined}
          style={[styles.label, compact && styles.labelCompact, { color: variant === "secondary" ? colors.text : colors.primaryContrast }]}
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
    overflow: "hidden",
    borderRadius: radius.button,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  buttonPressed: {
    shadowOpacity: 0.08,
  },
  secondaryFill: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonCompact: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
  },
  label: {
    letterSpacing: 0.2,
  },
  labelCompact: {
    ...typography.label,
  },
});
