import { Control, Controller } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppInput } from "@/src/components/ui/AppInput";
import { spacing } from "@/src/constants/spacing";
import { CustomerEditFormValues } from "@/src/features/customers/validation/customerEditSchema";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type CustomerEditProductRowProps = {
  index: number;
  control: Control<CustomerEditFormValues>;
  error?: string;
  onOpenPicker: () => void;
  onRemove: () => void;
};

export function CustomerEditProductRow({
  index,
  control,
  error,
  onOpenPicker,
  onRemove,
}: CustomerEditProductRowProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("customers");

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Controller
        control={control}
        name={`items.${index}.productNameSnapshot`}
        render={({ field }) => (
          <Pressable onPress={onOpenPicker} style={styles.productButton}>
            <Text style={[styles.productLabel, { color: colors.text }]}>{field.value}</Text>
            <Text style={[styles.change, { color: colors.primary }]}>{t("orderItems.change")}</Text>
          </Pressable>
        )}
      />
      <View style={styles.row}>
        <View style={styles.quantityField}>
          <Controller
            control={control}
            name={`items.${index}.quantity`}
            render={({ field }) => (
              <AppInput
                keyboardType="decimal-pad"
                onBlur={field.onBlur}
                onChangeText={(text) => field.onChange(text === "" ? 0 : Number(text.replace(",", ".")))}
                placeholder={t("orderItems.quantityPlaceholder")}
                value={String(field.value)}
              />
            )}
          />
        </View>
        <View style={styles.unitField}>
          <Controller
            control={control}
            name={`items.${index}.unit`}
            render={({ field }) => (
              <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder={t("orderItems.unitPlaceholder")} value={field.value} />
            )}
          />
        </View>
        <Pressable onPress={onRemove} style={styles.removeButton}>
          <Text style={[styles.removeLabel, { color: colors.danger }]}>{t("orderItems.remove")}</Text>
        </Pressable>
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  productButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productLabel: {
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  change: {
    fontSize: 13,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  quantityField: {
    flex: 1,
  },
  unitField: {
    flex: 1,
  },
  removeButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  removeLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  error: {
    fontSize: 13,
  },
});
