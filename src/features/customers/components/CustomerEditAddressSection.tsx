import { Control, Controller, FieldErrors, useWatch } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { FormField } from "@/src/components/forms/FormField";
import { AppInput } from "@/src/components/ui/AppInput";
import { CountrySelectField } from "@/src/features/countries/components/CountrySelectField";
import { CitySelectField } from "@/src/features/customers/components/CitySelectField";
import { RegionSelectField } from "@/src/features/regions/components/RegionSelectField";
import { spacing } from "@/src/constants/spacing";
import { CustomerEditFormValues } from "@/src/features/customers/validation/customerEditSchema";

type CustomerEditAddressSectionProps = {
  control: Control<CustomerEditFormValues>;
  errors?: FieldErrors<CustomerEditFormValues>["customer"];
};

export function CustomerEditAddressSection({
  control,
  errors,
}: CustomerEditAddressSectionProps) {
  const countryValue = useWatch({ control, name: "customer.country" }) ?? "";

  return (
    <View style={styles.container}>
      <FormField error={errors?.address?.message} label="Adresse">
        <Controller
          control={control}
          name="customer.address"
          render={({ field }) => (
            <AppInput
              autoCapitalize="words"
              multiline
              numberOfLines={3}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="z. B. Musterstrasse 12, 10115 Berlin"
              textAlignVertical="top"
              value={field.value}
            />
          )}
        />
      </FormField>
      <Controller
        control={control}
        name="customer.country"
        render={({ field }) => (
          <CountrySelectField error={errors?.country?.message} onChange={field.onChange} value={field.value ?? ""} />
        )}
      />
      <Controller
        control={control}
        name="customer.city"
        render={({ field }) => (
          <CitySelectField
            country={countryValue}
            error={errors?.city?.message}
            onChange={field.onChange}
            value={field.value ?? ""}
          />
        )}
      />
      <Controller
        control={control}
        name="customer.region"
        render={({ field }) => (
          <RegionSelectField
            country={countryValue}
            error={errors?.region?.message}
            onChange={field.onChange}
            value={field.value ?? ""}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
