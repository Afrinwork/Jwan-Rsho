import { FlatList } from "react-native";
import { useTranslation } from "react-i18next";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
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
      <AnimatedEntrance>
        <CitySummaryHeader cityCount={cities.length} />
      </AnimatedEntrance>
      <AnimatedEntrance delay={60}>
        <CityFilters countryOptions={countryOptions} onCountryChange={setCountry} onSearchTermChange={setSearchTerm} searchTerm={searchTerm} selectedCountry={country} />
      </AnimatedEntrance>
      {error ? <AnimatedEntrance delay={100}><ErrorState message={error} /></AnimatedEntrance> : null}
      {!cities.length ? (
        <AnimatedEntrance delay={120}><EmptyState
          message={t("listScreen.emptyMessage")}
          title={t("listScreen.emptyTitle")}
        /></AnimatedEntrance>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={cities}
          keyExtractor={(item) => item.normalizedName}
          renderItem={({ item, index }) => (
            <AnimatedEntrance delay={120 + index * 40}>
              <CityCard city={item} />
            </AnimatedEntrance>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = {
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
};
