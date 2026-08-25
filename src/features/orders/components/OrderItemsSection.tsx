import { useMemo, useState } from "react";
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFieldArrayUpdate,
  UseFormSetValue,
} from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { FormSectionCard } from "@/src/components/ui/FormSectionCard";
import { AppButton } from "@/src/components/ui/AppButton";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/constants/spacing";
import { ProductQuantityRow } from "@/src/features/orders/components/ProductQuantityRow";
import {
  ProductQuantityListModal,
  ProductQuantitySelection,
} from "@/src/features/orders/components/ProductQuantityListModal";
import { AddOrderFormValues } from "@/src/features/orders/validation/addOrderFormSchema";
import { getLocalizedName } from "@/src/utils/localizedName";

type OrderItemsSectionProps = {
  control: Control<AddOrderFormValues>;
  fields: FieldArrayWithId<AddOrderFormValues, "items", "id">[];
  append: UseFieldArrayAppend<AddOrderFormValues, "items">;
  remove: UseFieldArrayRemove;
  update: UseFieldArrayUpdate<AddOrderFormValues, "items">;
  setValue: UseFormSetValue<AddOrderFormValues>;
  errors?: FieldErrors<AddOrderFormValues>["items"];
};

export function OrderItemsSection({ control, fields, append, remove, update, errors }: OrderItemsSectionProps) {
  const { t, i18n } = useTranslation("orders");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);

  const rootError = errors?.root?.message ?? (typeof errors?.message === "string" ? errors.message : undefined);

  const initialQuantities = useMemo(
    () => Object.fromEntries(fields.map((field) => [field.productId, field.quantity])),
    [fields],
  );

  function handleConfirmSelection(selections: ProductQuantitySelection[]) {
    const selectedIds = new Set(selections.map((selection) => selection.product.id));
    const indicesToRemove = fields
      .map((field, index) => (selectedIds.has(field.productId) ? -1 : index))
      .filter((index) => index >= 0);
    if (indicesToRemove.length) {
      remove(indicesToRemove);
    }

    selections.forEach(({ product, quantity }, order) => {
      const existingIndex = fields.findIndex((field) => field.productId === product.id);
      const item = {
        productId: product.id,
        productNameSnapshot: getLocalizedName(product, i18n.language),
        quantity,
        unit: product.defaultUnit,
        sortOrder: order,
      };
      if (existingIndex >= 0) {
        update(existingIndex, item);
      } else {
        append(item);
      }
    });

    setPickerVisible(false);
  }

  return (
    <FormSectionCard title={t("items.sectionTitle")}>
      <View style={styles.container}>
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
            onRemove={() => setRemoveIndex(index)}
          />
        ))}
        <AppButton label={t("items.addProduct")} onPress={() => setPickerVisible(true)} size="compact" variant="secondary" />
        {rootError ? <ErrorState message={rootError} /> : null}
      </View>
      <ProductQuantityListModal
        initialQuantities={initialQuantities}
        onCancel={() => setPickerVisible(false)}
        onConfirm={handleConfirmSelection}
        visible={pickerVisible}
      />
      <ConfirmDialog
        confirmLabel={t("items.remove")}
        destructive
        message={t("items.removeConfirmMessage")}
        onCancel={() => setRemoveIndex(null)}
        onConfirm={() => {
          if (removeIndex !== null) {
            remove(removeIndex);
          }
          setRemoveIndex(null);
        }}
        title={t("items.removeConfirmTitle")}
        visible={removeIndex !== null}
      />
    </FormSectionCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
