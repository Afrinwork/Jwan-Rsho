import { Pressable, StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { CustomerMode } from "@/src/features/orders/types/orderFormTypes";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type CustomerModeSelectorProps = {
  mode: CustomerMode;
  onChange: (mode: CustomerMode) => void;
};

export function CustomerModeSelector({ mode, onChange }: CustomerModeSelectorProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.row}>
      <ModeCard
        active={mode === "existing"}
        colors={colors}
        label="Bestehender Kunde"
        onPress={() => onChange("existing")}
      />
      <ModeCard
        active={mode === "new"}
        colors={colors}
        label="Neuer Kunde"
        onPress={() => onChange("new")}
      />
    </View>
  );
}

type ModeCardProps = {
  active: boolean;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
};

function ModeCard({ active, label, onPress, colors }: ModeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: active ? colors.primaryMuted : colors.surface,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: active ? colors.primary : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
});
