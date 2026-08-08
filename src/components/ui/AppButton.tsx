import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/src/constants/colors";
import { spacing } from "@/src/constants/spacing";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
};

export function AppButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.button,
        variant === "secondary" && styles.secondaryButton,
        variant === "danger" && styles.dangerButton,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? colors.primary : colors.surface} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "secondary" && styles.secondaryLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryLabel: {
    color: colors.text,
  },
});
