import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type SettingsSectionProps = PropsWithChildren<{
  title: string;
}>;

export function SettingsSection({ title, children }: SettingsSectionProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, shadowColor: colors.shadow }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: spacing.md,
    gap: spacing.sm,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  title: { fontSize: 16, fontWeight: "700" },
});
