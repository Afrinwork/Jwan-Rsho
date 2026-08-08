import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppInput } from "@/src/components/ui/AppInput";
import { colors } from "@/src/constants/colors";

type CityFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedCountry: string;
  onCountryChange: (value: string) => void;
  countryOptions: string[];
};

export function CityFilters(props: CityFiltersProps) {
  const countries = ["Alle", ...props.countryOptions];
  return (
    <View style={styles.container}>
      <AppInput onChangeText={props.onSearchTermChange} placeholder="Suche nach Stadt" value={props.searchTerm} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {countries.map((value) => (
            <Pressable key={value} onPress={() => props.onCountryChange(value === "Alle" ? "" : value)} style={[styles.chip, currentCountry(props.selectedCountry, value) && styles.activeChip]}>
              <Text style={[styles.label, currentCountry(props.selectedCountry, value) && styles.activeLabel]}>{value}</Text>
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
  container: { gap: 12 },
  row: { flexDirection: "row", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.surface },
  activeChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { color: colors.text, fontSize: 14 },
  activeLabel: { color: colors.surface, fontWeight: "600" },
});
