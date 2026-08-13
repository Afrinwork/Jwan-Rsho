import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { FormField } from "@/src/components/forms/FormField";
import { AppInput } from "@/src/components/ui/AppInput";
import { spacing } from "@/src/constants/spacing";
import { useRegions } from "@/src/features/regions/hooks/useRegions";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { getLocalizedName } from "@/src/utils/localizedName";

type RegionSelectFieldProps = {
  value: string;
  onChange: (value: string) => void;
  country: string;
  error?: string;
};

export function RegionSelectField({ value, onChange, country, error }: RegionSelectFieldProps) {
  const { t, i18n } = useTranslation("regions");
  const { regions, loading } = useRegions();
  const colors = useThemeColors();
  const options = regions.filter((region) => region.isActive && (!country || region.country === country));

  return (
    <FormField error={error} label={t("selectField.label")}>
      <View style={styles.container}>
        <AppInput
          autoCapitalize="words"
          onChangeText={onChange}
          placeholder={country ? t("selectField.placeholderWithCountry") : t("selectField.placeholderNoCountry")}
          value={value}
        />
        {loading ? (
          <Text style={[styles.hint, { color: colors.mutedText }]}>{t("selectField.loading")}</Text>
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
                    {getLocalizedName(option, i18n.language)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.hint, { color: colors.mutedText }]}>
            {country ? t("selectField.emptyWithCountry") : t("selectField.emptyNoCountry")}
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
