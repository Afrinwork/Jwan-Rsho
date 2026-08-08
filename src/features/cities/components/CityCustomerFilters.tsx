import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppInput } from "@/src/components/ui/AppInput";
import { colors } from "@/src/constants/colors";

type CityCustomerFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
};

const options = [
  { label: "Alle", value: "all" },
  { label: "Offen", value: "open" },
  { label: "Erledigt", value: "completed" },
  { label: "Ohne offen", value: "no-open-order" },
];

export function CityCustomerFilters(props: CityCustomerFiltersProps) {
  return (
    <View style={styles.container}>
      <AppInput onChangeText={props.onSearchTermChange} placeholder="Suche nach Name, Telefon, Strasse" value={props.searchTerm} />
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
