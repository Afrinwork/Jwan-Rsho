import { Pressable, StyleSheet, Text, View } from "react-native";
import { ComponentType } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("orders");

  return (
    <View style={styles.row}>
      <ModeCard
        active={mode === "existing"}
        colors={colors}
        Icon={People20Regular}
        label={t("customerMode.existing.label")}
        onPress={() => onChange("existing")}
      />
      <ModeCard
        active={mode === "new"}
        colors={colors}
        Icon={PersonAdd20Regular}
        label={t("customerMode.new.label")}
        onPress={() => onChange("new")}
      />
    </View>
  );
}

type ModeCardProps = {
  active: boolean;
  label: string;
  Icon: ComponentType<{ color?: string; size?: number }>;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
};

function ModeCard({ active, label, Icon, onPress, colors }: ModeCardProps) {
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
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
});
