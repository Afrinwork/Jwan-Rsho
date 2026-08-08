import { Control, Controller, FieldErrors } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppInput } from "@/src/components/ui/AppInput";
import { FormField } from "@/src/components/forms/FormField";
import { spacing } from "@/src/constants/spacing";
import { AddOrderFormValues } from "@/src/features/orders/validation/addOrderFormSchema";

type CustomerAddressSectionProps = {
  control: Control<AddOrderFormValues>;
  errors?: FieldErrors<AddOrderFormValues>["customer"];
};

export function CustomerAddressSection({ control, errors }: CustomerAddressSectionProps) {
  return (
    <View style={styles.container}>
      <FormField error={errors?.street?.message} label="Strasse">
        <Controller
          control={control}
          name="customer.street"
          render={({ field }) => (
            <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder="Strasse" value={field.value ?? ""} />
          )}
        />
      </FormField>
      <View style={styles.row}>
        <View style={styles.rowItem}>
          <FormField error={errors?.houseNumber?.message} label="Hausnummer">
            <Controller
              control={control}
              name="customer.houseNumber"
              render={({ field }) => (
                <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder="Nr." value={field.value ?? ""} />
              )}
            />
          </FormField>
        </View>
        <View style={styles.rowItem}>
          <FormField error={errors?.postalCode?.message} label="PLZ">
            <Controller
              control={control}
              name="customer.postalCode"
              render={({ field }) => (
                <AppInput
                  keyboardType="number-pad"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="PLZ"
                  value={field.value ?? ""}
                />
              )}
            />
          </FormField>
        </View>
      </View>
      <FormField error={errors?.city?.message} label="Stadt">
        <Controller
          control={control}
          name="customer.city"
          render={({ field }) => (
            <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder="Stadt" value={field.value ?? ""} />
          )}
        />
      </FormField>
      <View style={styles.row}>
        <View style={styles.rowItem}>
          <FormField error={errors?.country?.message} label="Land">
            <Controller
              control={control}
              name="customer.country"
              render={({ field }) => (
                <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder="Land" value={field.value ?? ""} />
              )}
            />
          </FormField>
        </View>
        <View style={styles.rowItem}>
          <FormField error={errors?.region?.message} label="Region (optional)">
            <Controller
              control={control}
              name="customer.region"
              render={({ field }) => (
                <AppInput onBlur={field.onBlur} onChangeText={field.onChange} placeholder="Region" value={field.value ?? ""} />
              )}
            />
          </FormField>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
});
