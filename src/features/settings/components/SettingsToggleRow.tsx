import { StyleSheet, Switch, Text, View } from "react-native";

import { useThemeColors } from "@/src/hooks/useThemeColors";

type SettingsToggleRowProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function SettingsToggleRow({ label, value, onChange }: SettingsToggleRowProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.row, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Switch onValueChange={onChange} trackColor={{ true: colors.primary }} value={value} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  label: { fontSize: 15, flex: 1 },
});
