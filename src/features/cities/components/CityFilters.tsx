import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppInput } from "@/src/components/ui/AppInput";
import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type CityFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedCountry: string;
  onCountryChange: (value: string) => void;
  countryOptions: string[];
};

const ALL_COUNTRIES_VALUE = "Alle";

export function CityFilters(props: CityFiltersProps) {
  const { t } = useTranslation("cities");
  const countries = [ALL_COUNTRIES_VALUE, ...props.countryOptions];
  const colors = useThemeColors();

  return (
    <AppCard contentStyle={styles.container} style={{ shadowColor: colors.shadow }}>
      <AppInput onChangeText={props.onSearchTermChange} placeholder={t("filters.searchPlaceholder")} value={props.searchTerm} />
      <AppText color="muted" style={styles.kicker} variant="caption">
        {t("filters.countryKicker")}
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {countries.map((value) => (
            <Pressable
              key={value}
              onPress={() => props.onCountryChange(value === ALL_COUNTRIES_VALUE ? "" : value)}
              style={[
                styles.chip,
                {
                  backgroundColor: currentCountry(props.selectedCountry, value) ? colors.primary : colors.surface,
                  borderColor: currentCountry(props.selectedCountry, value) ? colors.primaryStrong : colors.border,
                },
              ]}
            >
              <AppText color={currentCountry(props.selectedCountry, value) ? colors.primaryContrast : "default"} style={styles.label} variant="caption">
                {value === ALL_COUNTRIES_VALUE ? t("filters.allCountries") : value}
              </AppText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </AppCard>
  );
}

function currentCountry(selectedCountry: string, value: string) {
  return (!selectedCountry && value === "Alle") || selectedCountry === value;
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  kicker: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  row: { flexDirection: "row", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  label: { fontSize: 14, fontWeight: "600" },
});
