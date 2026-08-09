import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.dangerBackground, borderColor: colors.dangerBorder }]}>
      <Text style={[styles.eyebrow, { color: colors.danger }]}>Hinweis</Text>
      <Text style={[styles.label, { color: colors.danger }]}>{message}</Text>
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
