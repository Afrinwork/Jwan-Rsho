import { useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";

import { CustomerDetailsHeader } from "@/src/features/customers/components/CustomerDetailsHeader";
import { CustomerOrderSection } from "@/src/features/customers/components/CustomerOrderSection";
import { useCustomerDetails } from "@/src/features/customers/hooks/useCustomerDetails";

type CustomerDetailsScreenProps = {
  customerId: string;
};

export function CustomerDetailsScreen(props: CustomerDetailsScreenProps) {
  const router = useRouter();
  const { loading, error, customer, openOrders, historyOrders, deleting, deleteCustomer } = useCustomerDetails(props.customerId);
  const { t } = useTranslation("customers");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (loading) {
    return <LoadingView label={t("details.loading")} />;
  }

  if (!customer) {
    return <EmptyState message={t("details.notFoundMessage")} title={t("details.notFoundTitle")} />;
  }

  return (
    <ScreenContainer>
      <CustomerDetailsHeader address={customer.address} city={customer.city} fullName={customer.fullName} phone={customer.phone} />
      {error ? <ErrorState message={error} /> : null}
      <CustomerOrderSection orders={openOrders} title={t("orderStatus.open")} />
      <CustomerOrderSection orders={historyOrders} title={t("details.orderHistory")} />
      <AppButton
        label={t("details.deleteButton")}
        loading={deleting}
        onPress={() => setConfirmingDelete(true)}
        variant="danger"
      />
      <ConfirmDialog
        destructive
        message={t("details.deleteConfirmMessage")}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          void deleteCustomer().then((success) => {
            if (success) {
              router.back();
            }
          });
        }}
        title={t("details.deleteConfirmTitle")}
        visible={confirmingDelete}
      />
    </ScreenContainer>
  );
}
