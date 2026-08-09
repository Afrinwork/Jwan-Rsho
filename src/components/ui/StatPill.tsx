import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type StatPillProps = {
  label: string;
  value: string;
  accent?: "primary" | "success";
};

export function StatPill({ label, value, accent = "primary" }: StatPillProps) {
  const colors = useThemeColors();
  const tone = accent === "success"
    ? { backgroundColor: colors.successBackground, borderColor: colors.successBorder, valueColor: colors.success }
    : { backgroundColor: colors.primaryMuted, borderColor: colors.border, valueColor: colors.primary };

  return (
    <View style={[styles.pill, { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor }]}>
      <Text style={[styles.value, { color: tone.valueColor }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minWidth: 88,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: "800",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
