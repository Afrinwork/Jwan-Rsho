import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/constants/colors";

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
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{props.label}</Text>
      <View style={styles.row}>
        {props.options.map((option) => {
          const active = props.value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => props.onChange(option.value)}
              style={[styles.chip, active && styles.activeChip]}
            >
              <Text style={[styles.chipLabel, active && styles.activeChipLabel]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { color: colors.mutedText, fontSize: 14, fontWeight: "600" },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.surface },
  activeChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { color: colors.text, fontSize: 14 },
  activeChipLabel: { color: colors.surface, fontWeight: "600" },
});
