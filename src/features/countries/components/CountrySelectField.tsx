import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { FormField } from "@/src/components/forms/FormField";
import { useCountries } from "@/src/features/countries/hooks/useCountries";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type CountrySelectFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function CountrySelectField({ value, onChange, error }: CountrySelectFieldProps) {
  const { t } = useTranslation("countries");
  const { countries, loading } = useCountries();
  const colors = useThemeColors();
  const activeCountries = countries.filter((country) => country.isActive);

  return (
    <FormField error={error} label={t("selectField.label")}>
      {loading ? (
        <Text style={[styles.hint, { color: colors.mutedText }]}>{t("selectField.loading")}</Text>
      ) : activeCountries.length === 0 ? (
        <Text style={[styles.hint, { color: colors.mutedText }]}>{t("selectField.empty")}</Text>
      ) : (
        <View style={styles.row}>
          {activeCountries.map((country) => {
            const active = value === country.name;
            return (
              <Pressable
                key={country.id}
                onPress={() => onChange(country.name)}
                style={[
                  styles.chip,
                  { borderColor: colors.border, backgroundColor: active ? colors.primary : colors.surface },
                ]}
              >
                <Text style={[styles.chipLabel, { color: active ? colors.primaryContrast : colors.text }]}>
                  {country.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </FormField>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 13 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipLabel: { fontSize: 14, fontWeight: "600" },
});
