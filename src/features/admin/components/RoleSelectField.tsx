import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { FormField } from "@/src/components/forms/FormField";
import { CreatableUserRole } from "@/src/features/admin/types/adminFormTypes";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { spacing } from "@/src/constants/spacing";

type RoleSelectFieldProps = {
  value: CreatableUserRole;
  onChange: (role: CreatableUserRole) => void;
};

export function RoleSelectField({ value, onChange }: RoleSelectFieldProps) {
  const { t } = useTranslation("admin");
  const colors = useThemeColors();

  return (
    <FormField label={t("createUser.roleLabel")}>
      <View style={styles.row}>
        <RoleOption active={value === "admin"} colors={colors} label={t("createUser.roleAdmin")} onPress={() => onChange("admin")} />
        <RoleOption active={value === "driver"} colors={colors} label={t("createUser.roleDriver")} onPress={() => onChange("driver")} />
      </View>
    </FormField>
  );
}

type RoleOptionProps = {
  active: boolean;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
};

function RoleOption({ active, label, onPress, colors }: RoleOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
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
  option: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
});
