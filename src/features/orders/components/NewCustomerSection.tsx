import { Control, FieldErrors, useWatch } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { FormSectionCard } from "@/src/components/ui/FormSectionCard";
import { spacing } from "@/src/constants/spacing";
import { CustomerAddressSection } from "@/src/features/customers/components/CustomerAddressSection";
import { CustomerForm } from "@/src/features/customers/components/CustomerForm";
import { DuplicateCustomerBanner } from "@/src/features/customers/components/DuplicateCustomerBanner";
import { useDuplicateCustomerCheck } from "@/src/features/customers/hooks/useDuplicateCustomerCheck";
import { AddOrderFormValues } from "@/src/features/orders/validation/addOrderFormSchema";
import { Customer } from "@/src/types/customer";

type NewCustomerSectionProps = {
  control: Control<AddOrderFormValues>;
  errors?: FieldErrors<AddOrderFormValues>["customer"];
  onSelectExisting: (customer: Customer) => void;
};

export function NewCustomerSection({ control, errors, onSelectExisting }: NewCustomerSectionProps) {
  const { t } = useTranslation("orders");
  const fullName = useWatch({ control, name: "customer.fullName" }) ?? "";
  const phone = useWatch({ control, name: "customer.phone" }) ?? "";
  const address = useWatch({ control, name: "customer.address" }) ?? "";
  const { matches } = useDuplicateCustomerCheck(fullName, phone, address);

  return (
    <View style={styles.container}>
      <FormSectionCard title={t("customerMode.new.label")}>
        <CustomerForm control={control} errors={errors} />
        <CustomerAddressSection control={control} errors={errors} />
      </FormSectionCard>
      <DuplicateCustomerBanner matches={matches} onSelect={onSelectExisting} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
