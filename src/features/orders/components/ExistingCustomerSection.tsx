import { StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { spacing } from "@/src/constants/spacing";
import { CustomerAddressView } from "@/src/features/customers/components/CustomerAddressView";
import { CustomerCard } from "@/src/features/customers/components/CustomerCard";
import { CustomerSearch } from "@/src/features/customers/components/CustomerSearch";
import { CustomerSearchResult } from "@/src/features/customers/components/CustomerSearchResult";
import { useCustomerSearch } from "@/src/features/customers/hooks/useCustomerSearch";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Customer } from "@/src/types/customer";

type ExistingCustomerSectionProps = {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer) => void;
  error?: string;
};

export function ExistingCustomerSection({ selectedCustomer, onSelect, error }: ExistingCustomerSectionProps) {
  const search = useCustomerSearch();
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.text }]}>Kunde suchen</Text>
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
      {selectedCustomer ? (
        <View style={styles.selected}>
          <CustomerCard customer={selectedCustomer} />
          <CustomerAddressView address={selectedCustomer} />
        </View>
      ) : null}
      {error ? <ErrorState message={error} /> : null}
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
  selected: {
    gap: spacing.sm,
  },
});
