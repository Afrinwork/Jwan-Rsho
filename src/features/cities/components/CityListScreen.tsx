import { FlatList } from "react-native";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { CityCard } from "@/src/features/cities/components/CityCard";
import { CityFilters } from "@/src/features/cities/components/CityFilters";
import { CitySummaryHeader } from "@/src/features/cities/components/CitySummaryHeader";
import { useCities } from "@/src/features/cities/hooks/useCities";

export function CityListScreen() {
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
    return <LoadingView label="Staedte werden geladen..." />;
  }

  return (
    <ScreenContainer>
      <CitySummaryHeader cityCount={cities.length} />
      <CityFilters countryOptions={countryOptions} onCountryChange={setCountry} onSearchTermChange={setSearchTerm} searchTerm={searchTerm} selectedCountry={country} />
      {error ? <ErrorState message={error} /> : null}
      {!cities.length ? (
        <EmptyState message="Noch keine passenden Staedte fuer den aktuellen Benutzer gefunden." title="Keine Staedte" />
      ) : (
        <FlatList data={cities} keyExtractor={(item) => item.normalizedName} renderItem={({ item }) => <CityCard city={item} />} />
      )}
    </ScreenContainer>
  );
}
