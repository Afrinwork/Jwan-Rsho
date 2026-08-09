import { Pressable, StyleSheet, Text, View } from "react-native";
import { ComponentType } from "react";
import { People20Regular, PersonAdd20Regular } from "@fluentui/react-native-icons";

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
        Icon={People20Regular}
        label="Bestehender Kunde"
        subtitle="Schneller Auftrag"
        onPress={() => onChange("existing")}
      />
      <ModeCard
        active={mode === "new"}
        colors={colors}
        Icon={PersonAdd20Regular}
        label="Neuer Kunde"
        subtitle="Neuen Kontakt anlegen"
        onPress={() => onChange("new")}
      />
    </View>
  );
}

type ModeCardProps = {
  active: boolean;
  label: string;
  subtitle: string;
  Icon: ComponentType<{ color?: string; size?: number }>;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
};

function ModeCard({ active, label, subtitle, Icon, onPress, colors }: ModeCardProps) {
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
      <Icon color={active ? colors.primary : colors.mutedText} size={20} />
      <Text style={[styles.label, { color: active ? colors.primary : colors.text }]}>{label}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>{subtitle}</Text>
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
    borderRadius: 20,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
  },
});
