import { Control, Controller } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppInput } from "@/src/components/ui/AppInput";
import { spacing } from "@/src/constants/spacing";
import { AddOrderFormValues } from "@/src/features/orders/validation/addOrderFormSchema";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type ProductQuantityRowProps = {
  index: number;
  control: Control<AddOrderFormValues>;
  error?: string;
  onRemove: () => void;
};

export function ProductQuantityRow({ index, control, error, onRemove }: ProductQuantityRowProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("orders");

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Controller
        control={control}
        name={`items.${index}.productNameSnapshot`}
        render={({ field }) => <Text style={[styles.productLabel, { color: colors.text }]}>{field.value}</Text>}
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
                placeholder={t("items.quantityPlaceholder")}
                value={field.value ? String(field.value) : ""}
              />
            )}
          />
        </View>
        <View style={styles.unitField}>
          <Controller
            control={control}
            name={`items.${index}.unit`}
            render={({ field }) => (
              <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder={t("items.unitPlaceholder")} value={field.value} />
            )}
          />
        </View>
        <Pressable onPress={onRemove} style={styles.removeButton}>
          <Text style={[styles.removeLabel, { color: colors.danger }]}>{t("items.remove")}</Text>
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
    padding: spacing.xs,
    gap: 6,
  },
  productLabel: {
    fontSize: 14,
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
    paddingVertical: spacing.xs,
  },
  removeLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  error: {
    fontSize: 12,
  },
});
