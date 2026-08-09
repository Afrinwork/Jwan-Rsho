import { AddCircle20Regular } from "@fluentui/react-native-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { FormField } from "@/src/components/forms/FormField";
import { AppInput } from "@/src/components/ui/AppInput";
import { spacing } from "@/src/constants/spacing";
import { useCustomerCities } from "@/src/features/customers/hooks/useCustomerCities";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type CitySelectFieldProps = {
  value: string;
  onChange: (value: string) => void;
  country: string;
  error?: string;
};

export function CitySelectField({ value, onChange, country, error }: CitySelectFieldProps) {
  const { cities, loading } = useCustomerCities();
  const colors = useThemeColors();
  const options = cities.filter((city) => !country || city.country === country);
  const normalizedValue = value.trim().toLowerCase();
  const isNewCity = normalizedValue.length > 0 && !options.some((option) => option.city.trim().toLowerCase() === normalizedValue);

  return (
    <FormField error={error} label="Stadt">
      <View style={styles.container}>
        <AppInput
          autoCapitalize="words"
          onChangeText={onChange}
          placeholder="z. B. Berlin"
          value={value}
        />
        {loading ? (
          <Text style={[styles.hint, { color: colors.mutedText }]}>Bestehende Staedte laden...</Text>
        ) : options.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.row}>
              {options.map((option) => {
                const active = option.city === value;
                return (
                  <Pressable
                    key={`${option.country}-${option.normalizedCity}`}
                    onPress={() => onChange(option.city)}
                    style={[
                      styles.chip,
                      {
                        borderColor: colors.border,
                        backgroundColor: active ? colors.primary : colors.surface,
                      },
                    ]}
                  >
                    <Text style={[styles.chipLabel, { color: active ? colors.primaryContrast : colors.text }]}>
                      {option.city}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : null}
        {isNewCity ? (
          <View style={[styles.addRow, { backgroundColor: colors.primaryMuted, borderColor: colors.border }]}>
            <View style={styles.addCopy}>
              <View style={styles.iconWrap}>
                <AddCircle20Regular color={colors.primary} />
              </View>
              <Text style={[styles.addText, { color: colors.text }]}>Neue Stadt hinzufuegen: {value.trim()}</Text>
            </View>
            <AppButton label="Uebernehmen" onPress={() => onChange(value.trim())} />
          </View>
        ) : null}
      </View>
    </FormField>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: { flexDirection: "row", gap: 8 },
  addRow: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 10,
    gap: 10,
  },
  addCopy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 28,
    alignItems: "center",
  },
  addText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipLabel: { fontSize: 14, fontWeight: "600" },
  hint: { fontSize: 13, lineHeight: 18 },
});
