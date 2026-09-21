import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { spacing } from "@/src/constants/spacing";
import { CityCard } from "@/src/features/cities/components/CityCard";
import { CityFilters } from "@/src/features/cities/components/CityFilters";
import { CitySummaryHeader } from "@/src/features/cities/components/CitySummaryHeader";
import { useCities } from "@/src/features/cities/hooks/useCities";
import { Customer } from "@/src/types/customer";
import { formatAddress } from "@/src/utils/formatAddress";

export function CityListScreen() {
  const { t } = useTranslation("cities");
  const {
    loading,
    error,
    cities,
    country,
    setCountry,
    searchTerm,
    setSearchTerm,
    countryOptions,
    customerSearchResults,
  } = useCities();
  const searchingCustomers = searchTerm.trim().length > 0;
  const customerGroups = useMemo(() => groupCustomersByCity(customerSearchResults), [customerSearchResults]);

  if (loading) {
    return <LoadingView label={t("listScreen.loading")} />;
  }

  return (
    <ScreenContainer>
      {searchingCustomers ? (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={customerGroups}
          keyExtractor={(item) => item.normalizedCity}
          ListEmptyComponent={
            !error ? <EmptyState message={t("listScreen.emptyCustomerSearchMessage")} title={t("listScreen.emptyCustomerSearchTitle")} /> : null
          }
          ListHeaderComponent={
            <Header
              cityCount={cities.length}
              country={country}
              countryOptions={countryOptions}
              error={error}
              searchTerm={searchTerm}
              setCountry={setCountry}
              setSearchTerm={setSearchTerm}
            />
          }
          renderItem={({ item, index }) => (
            <AnimatedEntrance delay={120 + index * 40}>
              <View style={styles.customerGroup}>
                <AppText style={styles.groupTitle} variant="subheading">
                  {item.city}
                </AppText>
                {item.customers.map((customer) => (
                  <CustomerSearchCard customer={customer} key={customer.id} />
                ))}
              </View>
            </AnimatedEntrance>
          )}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={cities}
          keyExtractor={(item) => item.normalizedName}
          ListEmptyComponent={
            !error ? <EmptyState message={t("listScreen.emptyMessage")} title={t("listScreen.emptyTitle")} /> : null
          }
          ListHeaderComponent={
            <Header
              cityCount={cities.length}
              country={country}
              countryOptions={countryOptions}
              error={error}
              searchTerm={searchTerm}
              setCountry={setCountry}
              setSearchTerm={setSearchTerm}
            />
          }
          renderItem={({ item, index }) => (
            <AnimatedEntrance delay={120 + index * 40}>
              <CityCard city={item} />
            </AnimatedEntrance>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

type HeaderProps = {
  cityCount: number;
  country: string;
  countryOptions: string[];
  error: string | null;
  searchTerm: string;
  setCountry: (value: string) => void;
  setSearchTerm: (value: string) => void;
};

function Header(props: HeaderProps) {
  return (
    <View style={styles.header}>
      <AnimatedEntrance>
        <CitySummaryHeader cityCount={props.cityCount} subtitle="" />
      </AnimatedEntrance>
      <AnimatedEntrance delay={40}>
        <CityFilters
          countryOptions={props.countryOptions}
          onCountryChange={props.setCountry}
          onSearchTermChange={props.setSearchTerm}
          searchTerm={props.searchTerm}
          selectedCountry={props.country}
        />
      </AnimatedEntrance>
      {props.error ? (
        <AnimatedEntrance delay={70}>
          <ErrorState message={props.error} />
        </AnimatedEntrance>
      ) : null}
    </View>
  );
}

function CustomerSearchCard({ customer }: { customer: Customer }) {
  return (
    <Pressable onPress={() => router.push(`/customer/edit/${customer.id}`)} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.992 : 1 }] }]}>
      <AppCard contentStyle={styles.customerCard} frosted>
        <AppText style={styles.customerName} variant="subheading">
          {customer.fullName}
        </AppText>
        <AppText color="muted" style={styles.customerMeta} variant="body">
          {customer.phone}
        </AppText>
        <AppText color="muted" style={styles.customerMeta} variant="body">
          {formatAddress([customer.address, customer.city])}
        </AppText>
      </AppCard>
    </Pressable>
  );
}

function groupCustomersByCity(customers: Customer[]) {
  const groups = new Map<string, { city: string; normalizedCity: string; customers: Customer[] }>();

  customers.forEach((customer) => {
    const normalizedCity = customer.normalizedCity || customer.city.trim().toLowerCase();
    const current = groups.get(normalizedCity);

    if (current) {
      current.customers.push(customer);
      return;
    }

    groups.set(normalizedCity, {
      city: customer.city,
      normalizedCity,
      customers: [customer],
    });
  });

  return [...groups.values()];
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  customerGroup: {
    gap: spacing.xs,
  },
  groupTitle: {
    paddingHorizontal: spacing.xs,
  },
  customerCard: {
    gap: spacing.xs,
    padding: spacing.md,
  },
  customerName: {},
  customerMeta: {},
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
});
