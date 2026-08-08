import { Control, Controller } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppInput } from "@/src/components/ui/AppInput";
import { spacing } from "@/src/constants/spacing";
import { AddOrderFormValues } from "@/src/features/orders/validation/addOrderFormSchema";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type ProductQuantityRowProps = {
  index: number;
  control: Control<AddOrderFormValues>;
  error?: string;
  onOpenPicker: () => void;
  onRemove: () => void;
};

export function ProductQuantityRow({ index, control, error, onOpenPicker, onRemove }: ProductQuantityRowProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Controller
        control={control}
        name={`items.${index}.productNameSnapshot`}
        render={({ field }) => (
          <Pressable onPress={onOpenPicker} style={styles.productButton}>
            <Text style={[styles.productLabel, { color: field.value ? colors.text : colors.mutedText }]}>
              {field.value || "Produkt waehlen"}
            </Text>
            <Text style={[styles.change, { color: colors.primary }]}>Aendern</Text>
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
                placeholder="Menge"
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
              <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder="Einheit" value={field.value} />
            )}
          />
        </View>
        <Pressable onPress={onRemove} style={styles.removeButton}>
          <Text style={[styles.removeLabel, { color: colors.danger }]}>Entfernen</Text>
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
