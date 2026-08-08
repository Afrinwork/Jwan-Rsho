import { useState } from "react";
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormSetValue,
} from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/constants/spacing";
import { ProductQuantityRow } from "@/src/features/orders/components/ProductQuantityRow";
import { AddOrderFormValues } from "@/src/features/orders/validation/addOrderFormSchema";
import { ProductPicker } from "@/src/features/products/components/ProductPicker";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Product } from "@/src/types/product";

type OrderItemsSectionProps = {
  control: Control<AddOrderFormValues>;
  fields: FieldArrayWithId<AddOrderFormValues, "items", "id">[];
  append: UseFieldArrayAppend<AddOrderFormValues, "items">;
  remove: UseFieldArrayRemove;
  setValue: UseFormSetValue<AddOrderFormValues>;
  errors?: FieldErrors<AddOrderFormValues>["items"];
};

export function OrderItemsSection({ control, fields, append, remove, setValue, errors }: OrderItemsSectionProps) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const colors = useThemeColors();

  const usedProductIds = fields.map((field) => field.productId).filter(Boolean);
  const rootError = errors?.root?.message ?? (typeof errors?.message === "string" ? errors.message : undefined);

  function openPickerFor(index: number) {
    setActiveIndex(index);
    setPickerVisible(true);
  }

  function handleAdd() {
    const newIndex = fields.length;
    append({ productId: "", productNameSnapshot: "", unit: "", quantity: 0 });
    openPickerFor(newIndex);
  }

  function handleSelect(product: Product) {
    if (activeIndex === null) {
      return;
    }
    setValue(`items.${activeIndex}.productId`, product.id, { shouldValidate: true });
    setValue(`items.${activeIndex}.productNameSnapshot`, product.name, { shouldValidate: true });
    setValue(`items.${activeIndex}.unit`, product.defaultUnit, { shouldValidate: true });
    setPickerVisible(false);
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.text }]}>Produkte</Text>
      {fields.map((field, index) => (
        <ProductQuantityRow
          control={control}
          error={
            errors?.[index]?.quantity?.message ??
            errors?.[index]?.unit?.message ??
            errors?.[index]?.productId?.message
          }
          index={index}
          key={field.id}
          onOpenPicker={() => openPickerFor(index)}
          onRemove={() => setRemoveIndex(index)}
        />
      ))}
      <AppButton label="Produkt hinzufuegen" onPress={handleAdd} variant="secondary" />
      {rootError ? <ErrorState message={rootError} /> : null}
      <ProductPicker
        excludeIds={usedProductIds}
        onClose={() => setPickerVisible(false)}
        onSelect={handleSelect}
        visible={pickerVisible}
      />
      <ConfirmDialog
        confirmLabel="Entfernen"
        destructive
        message="Dieses Produkt wird aus der Bestellung entfernt."
        onCancel={() => setRemoveIndex(null)}
        onConfirm={() => {
          if (removeIndex !== null) {
            remove(removeIndex);
          }
          setRemoveIndex(null);
        }}
        title="Produkt entfernen?"
        visible={removeIndex !== null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
  },
});
