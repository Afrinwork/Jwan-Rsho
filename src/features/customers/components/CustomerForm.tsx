import { Control, Controller, FieldErrors } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppInput } from "@/src/components/ui/AppInput";
import { FormField } from "@/src/components/forms/FormField";
import { spacing } from "@/src/constants/spacing";
import { AddOrderFormValues } from "@/src/features/orders/validation/addOrderFormSchema";

type CustomerFormProps = {
  control: Control<AddOrderFormValues>;
  errors?: FieldErrors<AddOrderFormValues>["customer"];
};

export function CustomerForm({ control, errors }: CustomerFormProps) {
  const { t } = useTranslation("customers");

  return (
    <View style={styles.container}>
      <FormField error={errors?.fullName?.message} label={t("form.nameLabel")}>
        <Controller
          control={control}
          name="customer.fullName"
          render={({ field }) => (
            <AppInput
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder={t("form.namePlaceholder")}
              value={field.value ?? ""}
            />
          )}
        />
      </FormField>
      <FormField error={errors?.phone?.message} label={t("form.phoneLabel")}>
        <Controller
          control={control}
          name="customer.phone"
          render={({ field }) => (
            <AppInput
              keyboardType="phone-pad"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder={t("form.phonePlaceholder")}
              value={field.value ?? ""}
            />
          )}
        />
      </FormField>
      <FormField error={errors?.note?.message} label={t("form.noteLabel")}>
        <Controller
          control={control}
          name="customer.note"
          render={({ field }) => (
            <AppInput
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder={t("form.notePlaceholder")}
              value={field.value ?? ""}
            />
          )}
        />
      </FormField>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
