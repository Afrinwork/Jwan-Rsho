import { StyleSheet, Switch, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type SettingsToggleRowProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function SettingsToggleRow({ label, value, onChange }: SettingsToggleRowProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.row, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <AppText style={styles.label} variant="bodyMedium">{label}</AppText>
      <Switch onValueChange={onChange} trackColor={{ true: colors.primary }} value={value} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  label: {
    flex: 1,
  },
});
