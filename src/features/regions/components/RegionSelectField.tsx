import { Pressable, StyleSheet, Text, View } from "react-native";

import { FormField } from "@/src/components/forms/FormField";
import { AppInput } from "@/src/components/ui/AppInput";
import { spacing } from "@/src/constants/spacing";
import { useRegions } from "@/src/features/regions/hooks/useRegions";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type RegionSelectFieldProps = {
  value: string;
  onChange: (value: string) => void;
  country: string;
  error?: string;
};

export function RegionSelectField({ value, onChange, country, error }: RegionSelectFieldProps) {
  const { regions, loading } = useRegions();
  const colors = useThemeColors();
  const options = regions.filter((region) => region.isActive && (!country || region.country === country));

  return (
    <FormField error={error} label="Region (optional)">
      <View style={styles.container}>
        <AppInput
          autoCapitalize="words"
          onChangeText={onChange}
          placeholder={country ? "Region zu diesem Land" : "Erst ein Land waehlen"}
          value={value}
        />
        {loading ? (
          <Text style={[styles.hint, { color: colors.mutedText }]}>Regionen laden...</Text>
        ) : options.length > 0 ? (
          <View style={styles.row}>
            {options.map((option) => {
              const active = option.name === value;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => onChange(option.name)}
                  style={[
                    styles.chip,
                    {
                      borderColor: colors.border,
                      backgroundColor: active ? colors.primary : colors.surface,
                    },
                  ]}
                >
                  <Text style={[styles.chipLabel, { color: active ? colors.primaryContrast : colors.text }]}>
                    {option.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.hint, { color: colors.mutedText }]}>
            {country ? "Keine Region vorhanden." : "Zuerst Land waehlen."}
          </Text>
        )}
      </View>
    </FormField>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipLabel: { fontSize: 14, fontWeight: "600" },
  hint: { fontSize: 13, lineHeight: 18 },
});
