import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { StyleSheet, View } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppInput } from "@/src/components/ui/AppInput";
import { AppText } from "@/src/components/ui/AppText";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { FormField } from "@/src/components/forms/FormField";
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
  // useWatch (not form.watch) so this value can be read during render
  // without opting the whole component out of compiler memoization.
  const nameValue = useWatch({ control: form.control, name: "name" });

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
    <AppCard contentStyle={styles.card}>
      <View style={styles.header}>
        <AppText variant="subheading">{submitLabel}</AppText>
        <AppText color="muted" variant="caption">
          {t("management.subtitle")}
        </AppText>
      </View>
      <View style={styles.container}>
        <FormField error={form.formState.errors.name?.message} label={t("form.nameLabel")}>
          <AppInput
            onBlur={() => form.trigger("name")}
            onChangeText={(value) => form.setValue("name", value, { shouldDirty: true, shouldValidate: true })}
            placeholder={t("form.namePlaceholder")}
            value={nameValue}
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
            <AppButton disabled={form.formState.isSubmitting} label={submitLabel} loading={form.formState.isSubmitting} onPress={submit} />
          </View>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xxs,
  },
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
