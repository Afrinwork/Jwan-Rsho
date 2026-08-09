import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/src/hooks/useThemeColors";

type Option = {
  label: string;
  value: string;
};

type SettingsChoiceRowProps = {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
};

export function SettingsChoiceRow(props: SettingsChoiceRowProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.mutedText }]}>{props.label}</Text>
      <View style={styles.row}>
        {props.options.map((option) => {
          const active = props.value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => props.onChange(option.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.surfaceMuted,
                  borderColor: active ? colors.primaryStrong : colors.border,
                },
              ]}
            >
              <Text style={[styles.chipLabel, { color: active ? colors.primaryContrast : colors.text }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 13, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipLabel: { fontSize: 14, fontWeight: "600" },
});
