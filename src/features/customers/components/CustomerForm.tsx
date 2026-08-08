import { Control, Controller, FieldErrors } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppInput } from "@/src/components/ui/AppInput";
import { FormField } from "@/src/components/forms/FormField";
import { spacing } from "@/src/constants/spacing";
import { AddOrderFormValues } from "@/src/features/orders/validation/addOrderFormSchema";

type CustomerFormProps = {
  control: Control<AddOrderFormValues>;
  errors?: FieldErrors<AddOrderFormValues>["customer"];
};

export function CustomerForm({ control, errors }: CustomerFormProps) {
  return (
    <View style={styles.container}>
      <FormField error={errors?.fullName?.message} label="Vollstaendiger Name">
        <Controller
          control={control}
          name="customer.fullName"
          render={({ field }) => (
            <AppInput
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Vollstaendiger Name"
              value={field.value ?? ""}
            />
          )}
        />
      </FormField>
      <FormField error={errors?.phone?.message} label="Telefonnummer">
        <Controller
          control={control}
          name="customer.phone"
          render={({ field }) => (
            <AppInput
              keyboardType="phone-pad"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Telefonnummer"
              value={field.value ?? ""}
            />
          )}
        />
      </FormField>
      <FormField error={errors?.note?.message} label="Notiz (optional)">
        <Controller
          control={control}
          name="customer.note"
          render={({ field }) => (
            <AppInput
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Notiz"
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
