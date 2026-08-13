import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

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
      <AppText color="muted" variant="label">
        {props.label}
      </AppText>
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
              <AppText color={active ? colors.primaryContrast : colors.text} variant="bodyMedium">
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
});
