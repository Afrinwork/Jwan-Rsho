import { Control, Controller, FieldErrors } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { FormField } from "@/src/components/forms/FormField";
import { AppInput } from "@/src/components/ui/AppInput";
import { spacing } from "@/src/constants/spacing";
import { CustomerEditFormValues } from "@/src/features/customers/validation/customerEditSchema";

type CustomerEditFormProps = {
  control: Control<CustomerEditFormValues>;
  errors?: FieldErrors<CustomerEditFormValues>["customer"];
};

export function CustomerEditForm({ control, errors }: CustomerEditFormProps) {
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
              value={field.value}
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
              value={field.value}
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
              multiline
              numberOfLines={3}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Notiz"
              style={styles.noteInput}
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
  noteInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
});
