import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { FormField } from "@/src/components/forms/FormField";
import { spacing } from "@/src/constants/spacing";
import { productSchema } from "@/src/features/products/validation/productSchema";
import { formatError } from "@/src/utils/formatError";

const productFormSchema = productSchema.pick({ name: true, defaultUnit: true, emoji: true, sortOrder: true });
export type ProductFormValues = z.input<typeof productFormSchema>;

const emptyProductValues: ProductFormValues = { name: "", defaultUnit: "", emoji: "", sortOrder: 0 };

type ProductFormProps = {
  initialValues?: ProductFormValues;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void>;
};

export function ProductForm({ initialValues, submitLabel, onCancel, onSubmit }: ProductFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialValues ?? emptyProductValues,
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await onSubmit(values);
      form.reset(emptyProductValues);
    } catch (error) {
      setSubmitError(formatError(error).message);
    }
  });

  return (
    <View style={styles.container}>
      <FormField error={form.formState.errors.name?.message} label="Produktname">
        <Controller
          control={form.control}
          name="name"
          render={({ field }) => (
            <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder="Produktname" value={field.value} />
          )}
        />
      </FormField>
      <FormField error={form.formState.errors.defaultUnit?.message} label="Einheit">
        <Controller
          control={form.control}
          name="defaultUnit"
          render={({ field }) => (
            <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder="z. B. Stueck, kg" value={field.value} />
          )}
        />
      </FormField>
      <FormField error={form.formState.errors.emoji?.message} label="Emoji (optional, fuer den Sammeltext)">
        <Controller
          control={form.control}
          name="emoji"
          render={({ field }) => (
            <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder="z. B. 🧀" value={field.value ?? ""} />
          )}
        />
      </FormField>
      <FormField error={form.formState.errors.sortOrder?.message} label="Sortierung">
        <Controller
          control={form.control}
          name="sortOrder"
          render={({ field }) => (
            <AppInput
              keyboardType="number-pad"
              onBlur={field.onBlur}
              onChangeText={(text) => field.onChange(text === "" ? 0 : Number(text))}
              placeholder="0"
              value={String(field.value)}
            />
          )}
        />
      </FormField>
      {submitError ? <ErrorState message={submitError} /> : null}
      <View style={styles.actions}>
        {onCancel ? (
          <View style={styles.actionButton}>
            <AppButton label="Abbrechen" onPress={onCancel} variant="secondary" />
          </View>
        ) : null}
        <View style={styles.actionButton}>
          <AppButton
            disabled={form.formState.isSubmitting}
            label={form.formState.isSubmitting ? "Speichert..." : submitLabel}
            loading={form.formState.isSubmitting}
            onPress={submit}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
