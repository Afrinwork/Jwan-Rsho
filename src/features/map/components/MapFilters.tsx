import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";
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
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, shadowColor: colors.shadow }]}>
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
  const colors = useThemeColors();
  const values = label === "Alle" ? options : ["Alle", ...options];

  return (
    <View style={styles.rowGroup}>
      <Text style={[styles.rowLabel, { color: colors.mutedText }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {values.map((value) => {
            const active = (!selectedValue && value === "Alle") || selectedValue === value;
            return (
              <Pressable
                key={`${label}-${value}`}
                onPress={() => onChange(value === "Alle" ? "" : value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primaryStrong : colors.border,
                  },
                ]}
              >
                <Text style={[styles.chipLabel, { color: active ? colors.primaryContrast : colors.text }]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.md,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  rowGroup: { gap: 6 },
  rowLabel: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  row: { flexDirection: "row", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipLabel: { fontSize: 14, fontWeight: "600" },
});
