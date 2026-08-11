import { Control, FieldErrors } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { FormSectionCard } from "@/src/components/ui/FormSectionCard";
import { spacing } from "@/src/constants/spacing";
import { CustomerAddressSection } from "@/src/features/customers/components/CustomerAddressSection";
import { CustomerForm } from "@/src/features/customers/components/CustomerForm";
import { AddOrderFormValues } from "@/src/features/orders/validation/addOrderFormSchema";

type NewCustomerSectionProps = {
  control: Control<AddOrderFormValues>;
  errors?: FieldErrors<AddOrderFormValues>["customer"];
};

export function NewCustomerSection({ control, errors }: NewCustomerSectionProps) {
  const { t } = useTranslation("orders");

  return (
    <View style={styles.container}>
      <FormSectionCard title={t("customerMode.new.label")}>
        <CustomerForm control={control} errors={errors} />
        <CustomerAddressSection control={control} errors={errors} />
      </FormSectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
