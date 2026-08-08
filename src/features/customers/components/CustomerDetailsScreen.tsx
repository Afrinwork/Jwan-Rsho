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
  const { loading, error, customer, openOrders, historyOrders } = useCustomerDetails(props.customerId);

  if (loading) {
    return <LoadingView label="Kundendetails werden geladen..." />;
  }

  if (!customer) {
    return <EmptyState message="Dieser Kunde wurde nicht gefunden." title="Kein Kunde" />;
  }

  return (
    <ScreenContainer>
      <CustomerDetailsHeader city={customer.city} fullName={customer.fullName} houseNumber={customer.houseNumber} phone={customer.phone} postalCode={customer.postalCode} street={customer.street} />
      {error ? <ErrorState message={error} /> : null}
      <CustomerOrderSection orders={openOrders} title="Offene Bestellung" />
      <CustomerOrderSection orders={historyOrders} title="Bestellverlauf" />
    </ScreenContainer>
  );
}
