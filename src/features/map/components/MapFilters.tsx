import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { mapT } from "@/src/features/map/i18n/mapT";

import { spacing } from "@/src/constants/spacing";
import { MapFilterState } from "@/src/features/map/types/mapTypes";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type MapFiltersProps = {
  filters: MapFilterState;
  countryOptions: string[];
  cityOptions: string[];
  regionOptions: string[];
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onReset: () => void;
  inline?: boolean;
};

type FilterKey = "country" | "city" | "region";

type FilterCategory = {
  key: FilterKey;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export function MapFilters(props: MapFiltersProps) {
  const colors = useThemeColors();
  const t = mapT;
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);

  const categories: FilterCategory[] = [
    { key: "country", label: t("filters.country"), value: props.filters.country, options: props.countryOptions, onChange: props.onCountryChange },
    { key: "city", label: t("filters.city"), value: props.filters.city, options: props.cityOptions, onChange: props.onCityChange },
    { key: "region", label: t("filters.region"), value: props.filters.region, options: props.regionOptions, onChange: props.onRegionChange },
  ];

  const activeCategory = categories.find((category) => category.key === openFilter) ?? null;
  const hasActiveFilter = Boolean(props.filters.country || props.filters.city || props.filters.region);
  const allLabel = t("filters.all");

  return (
    <View style={styles.container}>
      <View style={[styles.row, props.inline ? styles.inlineRow : null]}>
        <Pressable
          disabled={!hasActiveFilter}
          onPress={props.onReset}
          style={[
            styles.dropdownChip,
            props.inline ? styles.inlineChip : null,
            {
              backgroundColor: hasActiveFilter ? colors.primary : colors.surface,
              borderColor: hasActiveFilter ? colors.primaryStrong : colors.border,
              opacity: hasActiveFilter ? 1 : 0.5,
            },
          ]}
        >
          <Text style={[styles.chipLabel, { color: hasActiveFilter ? colors.primaryContrast : colors.mutedText }]}>
            {allLabel}
          </Text>
        </Pressable>
        {categories.map((category) => {
          const active = Boolean(category.value);
          const label = active ? category.value : category.label;

          return (
            <Pressable
              key={category.key}
              onPress={() => setOpenFilter(category.key)}
              style={[
                styles.dropdownChip,
                props.inline ? styles.inlineChip : null,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primaryStrong : colors.border,
                },
              ]}
            >
              <Text numberOfLines={1} style={[styles.chipLabel, { color: active ? colors.primaryContrast : colors.text }]}>
                {label} v
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Modal animationType="fade" onRequestClose={() => setOpenFilter(null)} transparent visible={activeCategory !== null}>
        <View style={styles.overlay}>
          <Pressable onPress={() => setOpenFilter(null)} style={styles.backdrop} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{activeCategory?.label}</Text>
            <View style={styles.optionsWrap}>
              {[allLabel, ...(activeCategory?.options ?? [])].map((value) => {
                const selected = (!activeCategory?.value && value === allLabel) || activeCategory?.value === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => {
                      activeCategory?.onChange(value === allLabel ? "" : value);
                      setOpenFilter(null);
                    }}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: selected ? colors.primary : colors.surfaceElevated,
                        borderColor: selected ? colors.primaryStrong : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipLabel, { color: selected ? colors.primaryContrast : colors.text }]}>
                      {value}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingRight: spacing.sm,
  },
  dropdownChip: {
    minWidth: 88,
    maxWidth: 180,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineRow: {
    paddingRight: 0,
  },
  inlineChip: {
    minWidth: 76,
    maxWidth: 150,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
