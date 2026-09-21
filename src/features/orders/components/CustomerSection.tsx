import { Control, FieldErrors, useWatch } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ErrorState } from "@/src/components/ui/ErrorState";
import { FormSectionCard } from "@/src/components/ui/FormSectionCard";
import { spacing } from "@/src/constants/spacing";
import { CustomerAddressSection } from "@/src/features/customers/components/CustomerAddressSection";
import { CustomerForm } from "@/src/features/customers/components/CustomerForm";
import { useDuplicateCustomerCheck } from "@/src/features/customers/hooks/useDuplicateCustomerCheck";
import { AddOrderFormValues } from "@/src/features/orders/validation/addOrderFormSchema";
import { Customer } from "@/src/types/customer";

type CustomerSectionProps = {
  control: Control<AddOrderFormValues>;
  errors?: FieldErrors<AddOrderFormValues>["customer"];
  customerIdError?: string;
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  onClearCustomer: () => void;
};

export function CustomerSection({
  control,
  errors,
  customerIdError,
  selectedCustomer,
  onSelectCustomer,
  onClearCustomer,
}: CustomerSectionProps) {
  const { t } = useTranslation("orders");
  const fullName = useWatch({ control, name: "customer.fullName" }) ?? "";
  const phone = useWatch({ control, name: "customer.phone" }) ?? "";
  const address = useWatch({ control, name: "customer.address" }) ?? "";
  const { matches } = useDuplicateCustomerCheck(fullName, phone, address);
  const suggestions = selectedCustomer ? [] : matches;

  return (
    <View style={styles.container}>
      <FormSectionCard title={t("customerSection.title")}>
        <CustomerForm
          control={control}
          errors={errors}
          onClearSelection={onClearCustomer}
          onSelectSuggestion={onSelectCustomer}
          selectedCustomer={selectedCustomer}
          suggestions={suggestions}
        />
        <CustomerAddressSection control={control} errors={errors} />
      </FormSectionCard>
      {customerIdError ? <ErrorState message={customerIdError} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
