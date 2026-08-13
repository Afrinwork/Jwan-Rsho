import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { StyleSheet, View } from "react-native";

import { FormField } from "@/src/components/forms/FormField";
import { LocalizedNameField } from "@/src/components/forms/LocalizedNameField";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/constants/spacing";
import { regionSchema } from "@/src/features/regions/validation/regionSchema";
import { formatError } from "@/src/utils/formatError";

const regionFormSchema = regionSchema.pick({ name: true, nameAr: true, country: true, city: true });
export type RegionFormValues = z.input<typeof regionFormSchema>;

type RegionFormProps = {
  initialValues?: RegionFormValues;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (values: RegionFormValues) => Promise<void>;
};

export function RegionForm({ initialValues, submitLabel, onCancel, onSubmit }: RegionFormProps) {
  const { t } = useTranslation("regions");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<RegionFormValues>({
    resolver: zodResolver(regionFormSchema),
    defaultValues: initialValues ?? { name: "", nameAr: "", country: "", city: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await onSubmit(values);
      form.reset({ name: "", nameAr: "", country: "", city: "" });
    } catch (error) {
      setSubmitError(formatError(error).message);
    }
  });

  return (
    <View style={styles.container}>
      <LocalizedNameField
        arError={form.formState.errors.nameAr?.message}
        arField="nameAr"
        arPlaceholder={t("form.nameArPlaceholder")}
        control={form.control}
        label={t("form.nameLabel")}
        nameError={form.formState.errors.name?.message}
        nameField="name"
        namePlaceholder={t("form.namePlaceholder")}
      />
      <FormField error={form.formState.errors.country?.message} label={t("form.countryLabel")}>
        <Controller control={form.control} name="country" render={({ field }) => <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder={t("form.countryPlaceholder")} value={field.value} />} />
      </FormField>
      <FormField error={form.formState.errors.city?.message} label={t("form.cityLabel")}>
        <Controller control={form.control} name="city" render={({ field }) => <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder={t("form.cityPlaceholder")} value={field.value ?? ""} />} />
      </FormField>
      {submitError ? <ErrorState message={submitError} /> : null}
      <View style={styles.actions}>
        {onCancel ? <View style={styles.actionButton}><AppButton label={t("common:cancel")} onPress={onCancel} variant="secondary" /></View> : null}
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
