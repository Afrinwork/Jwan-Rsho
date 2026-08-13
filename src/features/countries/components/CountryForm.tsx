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
import { countrySchema } from "@/src/features/countries/validation/countrySchema";
import { formatError } from "@/src/utils/formatError";

const countryFormSchema = countrySchema.pick({ name: true, nameAr: true, isoCode: true, sortOrder: true });
export type CountryFormValues = z.input<typeof countryFormSchema>;

type CountryFormProps = {
  initialValues?: CountryFormValues;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (values: CountryFormValues) => Promise<void>;
};

export function CountryForm({ initialValues, submitLabel, onCancel, onSubmit }: CountryFormProps) {
  const { t } = useTranslation("countries");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<CountryFormValues>({
    resolver: zodResolver(countryFormSchema),
    defaultValues: initialValues ?? { name: "", nameAr: "", isoCode: "", sortOrder: 0 },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await onSubmit(values);
      form.reset({ name: "", nameAr: "", isoCode: "", sortOrder: 0 });
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
      <FormField error={form.formState.errors.isoCode?.message} label={t("form.isoCodeLabel")}>
        <Controller control={form.control} name="isoCode" render={({ field }) => <AppInput autoCapitalize="characters" maxLength={3} onBlur={field.onBlur} onChangeText={field.onChange} placeholder={t("form.isoCodePlaceholder")} value={field.value ?? ""} />} />
      </FormField>
      <FormField error={form.formState.errors.sortOrder?.message} label={t("form.sortOrderLabel")}>
        <Controller control={form.control} name="sortOrder" render={({ field }) => <AppInput keyboardType="number-pad" onBlur={field.onBlur} onChangeText={(text) => field.onChange(text === "" ? 0 : Number(text))} placeholder={t("form.sortOrderPlaceholder")} value={String(field.value)} />} />
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
