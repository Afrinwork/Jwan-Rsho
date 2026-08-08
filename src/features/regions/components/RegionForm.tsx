import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { StyleSheet, View } from "react-native";

import { FormField } from "@/src/components/forms/FormField";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/constants/spacing";
import { regionSchema } from "@/src/features/regions/validation/regionSchema";
import { formatError } from "@/src/utils/formatError";

const regionFormSchema = regionSchema.pick({ name: true, country: true, city: true });
export type RegionFormValues = z.input<typeof regionFormSchema>;

type RegionFormProps = {
  initialValues?: RegionFormValues;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (values: RegionFormValues) => Promise<void>;
};

export function RegionForm({ initialValues, submitLabel, onCancel, onSubmit }: RegionFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<RegionFormValues>({
    resolver: zodResolver(regionFormSchema),
    defaultValues: initialValues ?? { name: "", country: "", city: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await onSubmit(values);
      form.reset({ name: "", country: "", city: "" });
    } catch (error) {
      setSubmitError(formatError(error).message);
    }
  });

  return (
    <View style={styles.container}>
      <FormField error={form.formState.errors.name?.message} label="Region">
        <Controller control={form.control} name="name" render={({ field }) => <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder="Region" value={field.value} />} />
      </FormField>
      <FormField error={form.formState.errors.country?.message} label="Land">
        <Controller control={form.control} name="country" render={({ field }) => <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder="Land" value={field.value} />} />
      </FormField>
      <FormField error={form.formState.errors.city?.message} label="Stadt (optional)">
        <Controller control={form.control} name="city" render={({ field }) => <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder="Stadt" value={field.value ?? ""} />} />
      </FormField>
      {submitError ? <ErrorState message={submitError} /> : null}
      <View style={styles.actions}>
        {onCancel ? <View style={styles.actionButton}><AppButton label="Abbrechen" onPress={onCancel} variant="secondary" /></View> : null}
        <View style={styles.actionButton}><AppButton disabled={form.formState.isSubmitting} label={submitLabel} loading={form.formState.isSubmitting} onPress={submit} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.sm },
  actionButton: { flex: 1 },
});
