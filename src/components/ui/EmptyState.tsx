import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.mutedText }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
});
