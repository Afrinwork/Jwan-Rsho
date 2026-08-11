import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppInput } from "@/src/components/ui/AppInput";
import { colors } from "@/src/constants/colors";

type CityCustomerFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
};

export function CityCustomerFilters(props: CityCustomerFiltersProps) {
  const { t } = useTranslation("cities");
  const options = [
    { label: t("customerFilters.all"), value: "all" },
    { label: t("customerFilters.open"), value: "open" },
    { label: t("customerFilters.completed"), value: "completed" },
    { label: t("customerFilters.noOpenOrder"), value: "no-open-order" },
  ];

  return (
    <View style={styles.container}>
      <AppInput onChangeText={props.onSearchTermChange} placeholder={t("customerFilters.searchPlaceholder")} value={props.searchTerm} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {options.map((value) => (
            <Pressable key={value.value} onPress={() => props.onStatusChange(value.value)} style={[styles.chip, props.selectedStatus === value.value && styles.activeChip]}>
              <Text style={[styles.label, props.selectedStatus === value.value && styles.activeLabel]}>{value.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  row: { flexDirection: "row", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.surface },
  activeChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { color: colors.text, fontSize: 14 },
  activeLabel: { color: colors.surface, fontWeight: "600" },
});
