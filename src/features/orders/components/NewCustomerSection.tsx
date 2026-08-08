import { Control, FieldErrors } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { CustomerAddressSection } from "@/src/features/customers/components/CustomerAddressSection";
import { CustomerForm } from "@/src/features/customers/components/CustomerForm";
import { AddOrderFormValues } from "@/src/features/orders/validation/addOrderFormSchema";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type NewCustomerSectionProps = {
  control: Control<AddOrderFormValues>;
  errors?: FieldErrors<AddOrderFormValues>["customer"];
};

export function NewCustomerSection({ control, errors }: NewCustomerSectionProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.text }]}>Kundendaten</Text>
      <CustomerForm control={control} errors={errors} />
      <Text style={[styles.heading, { color: colors.text }]}>Adresse</Text>
      <CustomerAddressSection control={control} errors={errors} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
  },
});
