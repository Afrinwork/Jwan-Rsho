import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("products");
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
      <FormField error={form.formState.errors.name?.message} label={t("form.nameLabel")}>
        <Controller
          control={form.control}
          name="name"
          render={({ field }) => (
            <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder={t("form.namePlaceholder")} value={field.value} />
          )}
        />
      </FormField>
      <FormField error={form.formState.errors.defaultUnit?.message} label={t("form.unitLabel")}>
        <Controller
          control={form.control}
          name="defaultUnit"
          render={({ field }) => (
            <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder={t("form.unitPlaceholder")} value={field.value} />
          )}
        />
      </FormField>
      <FormField error={form.formState.errors.emoji?.message} label={t("form.emojiLabel")}>
        <Controller
          control={form.control}
          name="emoji"
          render={({ field }) => (
            <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder={t("form.emojiPlaceholder")} value={field.value ?? ""} />
          )}
        />
      </FormField>
      <FormField error={form.formState.errors.sortOrder?.message} label={t("form.sortOrderLabel")}>
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
            <AppButton label={t("common:cancel")} onPress={onCancel} variant="secondary" />
          </View>
        ) : null}
        <View style={styles.actionButton}>
          <AppButton
            disabled={form.formState.isSubmitting}
            label={form.formState.isSubmitting ? t("form.submitting") : submitLabel}
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
