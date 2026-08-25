import { FlatList, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { spacing } from "@/src/constants/spacing";
import { CityCard } from "@/src/features/cities/components/CityCard";
import { CityFilters } from "@/src/features/cities/components/CityFilters";
import { CitySummaryHeader } from "@/src/features/cities/components/CitySummaryHeader";
import { useCities } from "@/src/features/cities/hooks/useCities";

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
  } = useCities();

  if (loading) {
    return <LoadingView label={t("listScreen.loading")} />;
  }

  return (
    <ScreenContainer>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={cities}
        keyExtractor={(item) => item.normalizedName}
        ListEmptyComponent={
          !error ? <EmptyState message={t("listScreen.emptyMessage")} title={t("listScreen.emptyTitle")} /> : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <AnimatedEntrance>
              <CitySummaryHeader cityCount={cities.length} subtitle="" />
            </AnimatedEntrance>
            <AnimatedEntrance delay={40}>
              <CityFilters
                countryOptions={countryOptions}
                onCountryChange={setCountry}
                onSearchTermChange={setSearchTerm}
                searchTerm={searchTerm}
                selectedCountry={country}
              />
            </AnimatedEntrance>
            {error ? (
              <AnimatedEntrance delay={70}>
                <ErrorState message={error} />
              </AnimatedEntrance>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedEntrance delay={120 + index * 40}>
            <CityCard city={item} />
          </AnimatedEntrance>
        )}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
});
