import { StyleSheet, View } from "react-native";

import { FormSectionCard } from "@/src/components/ui/FormSectionCard";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { spacing } from "@/src/constants/spacing";
import { CustomerAddressView } from "@/src/features/customers/components/CustomerAddressView";
import { CustomerCard } from "@/src/features/customers/components/CustomerCard";
import { CustomerSearch } from "@/src/features/customers/components/CustomerSearch";
import { CustomerSearchResult } from "@/src/features/customers/components/CustomerSearchResult";
import { useCustomerSearch } from "@/src/features/customers/hooks/useCustomerSearch";
import { Customer } from "@/src/types/customer";

type ExistingCustomerSectionProps = {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer) => void;
  error?: string;
};

export function ExistingCustomerSection({ selectedCustomer, onSelect, error }: ExistingCustomerSectionProps) {
  const search = useCustomerSearch();

  return (
    <View style={styles.container}>
      <FormSectionCard subtitle="Suche nach Name, Telefon, Stadt oder Adresse und uebernimm den Kunden direkt." title="Kunde suchen">
        <CustomerSearch onQueryChange={search.setQuery} query={search.query} />
        {search.loading ? <LoadingView label="Suche laeuft..." /> : null}
        {search.error ? <ErrorState message={search.error} /> : null}
        {!search.loading && search.query.trim() && search.results.length === 0 ? (
          <EmptyState message="Kein Kunde gefunden." title="Keine Treffer" />
        ) : null}
        {search.results.map((customer) => (
          <CustomerSearchResult
            customer={customer}
            key={customer.id}
            onPress={() => onSelect(customer)}
            selected={selectedCustomer?.id === customer.id}
          />
        ))}
      </FormSectionCard>
      {selectedCustomer ? (
        <FormSectionCard subtitle="Die ausgewaehlte Adresse wird spaeter exakt fuer Navigation und Karte verwendet." title="Ausgewaehlter Kunde">
          <CustomerCard customer={selectedCustomer} />
          <CustomerAddressView address={selectedCustomer} />
        </FormSectionCard>
      ) : null}
      {error ? <ErrorState message={error} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
