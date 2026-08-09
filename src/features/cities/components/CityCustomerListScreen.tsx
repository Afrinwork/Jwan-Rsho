import { FlatList, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { CityCustomerCard } from "@/src/features/cities/components/CityCustomerCard";
import { CityCustomerFilters } from "@/src/features/cities/components/CityCustomerFilters";
import { CityProductTotals } from "@/src/features/cities/components/CityProductTotals";
import { CitySelectionBar } from "@/src/features/cities/components/CitySelectionBar";
import { CitySummaryHeader } from "@/src/features/cities/components/CitySummaryHeader";
import { useCityCustomerSelection } from "@/src/features/cities/hooks/useCityCustomerSelection";
import { useCityCustomers } from "@/src/features/cities/hooks/useCityCustomers";

type CityCustomerListScreenProps = {
  normalizedCity: string;
};

export function CityCustomerListScreen(props: CityCustomerListScreenProps) {
  const router = useRouter();
  const {
    loading,
    error,
    customers,
    searchTerm,
    setSearchTerm,
    status,
    setStatus,
    productTotals,
    completeOrder,
    completingOrderId,
  } = useCityCustomers(props.normalizedCity);
  const selection = useCityCustomerSelection(customers);

  if (loading) {
    return <LoadingView label="Kunden dieser Stadt werden geladen..." />;
  }

  return (
    <ScreenContainer>
      <FlatList
        contentContainerStyle={styles.content}
        data={customers}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !error ? (
            <EmptyState message="Keine passenden Kunden fuer diese Stadt gefunden." title="Keine Kunden" />
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <CitySummaryHeader cityCount={customers.length} />
            <CityProductTotals totals={productTotals} />
            <CitySelectionBar selectedCount={selection.selectedCount} />
            <CityCustomerFilters
              onSearchTermChange={setSearchTerm}
              onStatusChange={setStatus}
              searchTerm={searchTerm}
              selectedStatus={status}
            />
            {error ? <ErrorState message={error} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <CityCustomerCard
            completing={completingOrderId === item.currentOpenOrderId}
            customer={item}
            onComplete={() => item.currentOpenOrderId && completeOrder(item.currentOpenOrderId)}
            onPressDetails={() => router.push(`/customer/${item.id}`)}
            onToggleSelection={() => selection.toggleSelection(item.id)}
            selected={selection.isSelected(item.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    gap: 12,
    paddingBottom: 24,
  },
  header: {
    gap: 12,
    marginBottom: 12,
  },
});
