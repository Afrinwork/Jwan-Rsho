import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/constants/colors";
import { MapFilterState } from "@/src/features/map/types/mapTypes";

type MapFiltersProps = {
  filters: MapFilterState;
  countryOptions: string[];
  cityOptions: string[];
  regionOptions: string[];
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onReset: () => void;
};

export function MapFilters(props: MapFiltersProps) {
  return (
    <View style={styles.container}>
      <FilterRow label="Alle" options={["Alle"]} selectedValue="" onChange={() => props.onReset()} />
      <FilterRow label="Land" options={props.countryOptions} selectedValue={props.filters.country} onChange={props.onCountryChange} />
      <FilterRow label="Stadt" options={props.cityOptions} selectedValue={props.filters.city} onChange={props.onCityChange} />
      <FilterRow label="Region" options={props.regionOptions} selectedValue={props.filters.region} onChange={props.onRegionChange} />
    </View>
  );
}

type FilterRowProps = {
  label: string;
  options: string[];
  selectedValue: string;
  onChange: (value: string) => void;
};

function FilterRow({ label, options, selectedValue, onChange }: FilterRowProps) {
  const values = label === "Alle" ? options : ["Alle", ...options];

  return (
    <View style={styles.rowGroup}>
      <Text style={styles.rowLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {values.map((value) => {
            const active = (!selectedValue && value === "Alle") || selectedValue === value;
            return (
              <Pressable
                key={`${label}-${value}`}
                onPress={() => onChange(value === "Alle" ? "" : value)}
                style={[styles.chip, active && styles.activeChip]}
              >
                <Text style={[styles.chipLabel, active && styles.activeLabel]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  rowGroup: { gap: 6 },
  rowLabel: { color: colors.mutedText, fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.surface },
  activeChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { color: colors.text, fontSize: 14 },
  activeLabel: { color: colors.surface, fontWeight: "600" },
});
