import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppInput } from "@/src/components/ui/AppInput";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  step?: number;
};

export function QuantityStepper({ value, onChange, step = 1 }: QuantityStepperProps) {
  const colors = useThemeColors();

  function clamp(next: number) {
    return next < 0 ? 0 : next;
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(clamp(value - step))}
        style={[styles.button, { backgroundColor: colors.dangerBackground, borderColor: colors.dangerBorder }]}
      >
        <Text style={[styles.buttonLabel, { color: colors.danger }]}>−</Text>
      </Pressable>
      <AppInput
        keyboardType="decimal-pad"
        onChangeText={(text) => onChange(text === "" ? 0 : clamp(Number(text.replace(",", "."))))}
        style={styles.input}
        value={String(value)}
      />
      <Pressable
        onPress={() => onChange(clamp(value + step))}
        style={[styles.button, { backgroundColor: colors.primaryMuted, borderColor: colors.border }]}
      >
        <Text style={[styles.buttonLabel, { color: colors.primary }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  input: {
    width: 64,
    paddingHorizontal: spacing.xs,
    paddingVertical: 8,
    textAlign: "center",
  },
});
