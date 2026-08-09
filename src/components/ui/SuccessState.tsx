import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type SuccessStateProps = {
  message: string;
};

export function SuccessState({ message }: SuccessStateProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.successBackground, borderColor: colors.successBorder }]}>
      <Text style={[styles.eyebrow, { color: colors.success }]}>Erfolg</Text>
      <Text style={[styles.label, { color: colors.success }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  label: {
    fontSize: 14,
    lineHeight: 21,
  },
});
