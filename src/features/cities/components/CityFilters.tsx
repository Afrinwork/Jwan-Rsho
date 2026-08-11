import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppInput } from "@/src/components/ui/AppInput";
import { spacing } from "@/src/constants/spacing";
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
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, shadowColor: colors.shadow }]}>
      <AppInput onChangeText={props.onSearchTermChange} placeholder={t("filters.searchPlaceholder")} value={props.searchTerm} />
      <Text style={[styles.kicker, { color: colors.mutedText }]}>{t("filters.countryKicker")}</Text>
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
              <Text style={[styles.label, { color: currentCountry(props.selectedCountry, value) ? colors.primaryContrast : colors.text }]}>{value === ALL_COUNTRIES_VALUE ? t("filters.allCountries") : value}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function currentCountry(selectedCountry: string, value: string) {
  return (!selectedCountry && value === "Alle") || selectedCountry === value;
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.md,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
  },
  kicker: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  row: { flexDirection: "row", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  label: { fontSize: 14, fontWeight: "600" },
});
