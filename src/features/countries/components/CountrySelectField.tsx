import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ChevronDown20Regular } from "@fluentui/react-native-icons";

import { FormField } from "@/src/components/forms/FormField";
import { AppButton } from "@/src/components/ui/AppButton";
import { useCountries } from "@/src/features/countries/hooks/useCountries";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";
import { getLocalizedName } from "@/src/utils/localizedName";

type CountrySelectFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function CountrySelectField({ value, onChange, error }: CountrySelectFieldProps) {
  const { t, i18n } = useTranslation("countries");
  const { countries, loading } = useCountries();
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const activeCountries = useMemo(() => countries.filter((country) => country.isActive), [countries]);
  const selectedCountry = activeCountries.find((country) => country.name === value);
  const selectedLabel = selectedCountry ? getLocalizedName(selectedCountry, i18n.language) : t("selectField.label");

  return (
    <FormField error={error} label={t("selectField.label")}>
      {loading ? (
        <Text style={[styles.hint, { color: colors.mutedText }]}>{t("selectField.loading")}</Text>
      ) : activeCountries.length === 0 ? (
        <Text style={[styles.hint, { color: colors.mutedText }]}>{t("selectField.empty")}</Text>
      ) : (
        <>
          <Pressable
            onPress={() => setOpen(true)}
            style={[styles.trigger, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <Text numberOfLines={1} style={[styles.triggerLabel, { color: value ? colors.text : colors.mutedText }]}>
              {selectedLabel}
            </Text>
            <ChevronDown20Regular color={colors.mutedText} />
          </Pressable>
          <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
            <View style={styles.overlay}>
              <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
                  {activeCountries.map((country) => {
                    const active = value === country.name;
                    return (
                      <Pressable
                        key={country.id}
                        onPress={() => {
                          onChange(country.name);
                          setOpen(false);
                        }}
                        style={[
                          styles.option,
                          {
                            backgroundColor: active ? colors.primaryMuted : colors.surfaceElevated,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.optionLabel, { color: active ? colors.primary : colors.text }]}>
                          {getLocalizedName(country, i18n.language)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <AppButton label={t("common:cancel")} onPress={() => setOpen(false)} size="compact" variant="secondary" />
              </View>
            </View>
          </Modal>
        </>
      )}
    </FormField>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 13 },
  trigger: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  triggerLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.18)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    borderWidth: 1,
    borderRadius: radius.card,
    maxHeight: "70%",
    padding: spacing.md,
    gap: spacing.sm,
  },
  sheetContent: {
    gap: spacing.xs,
  },
  option: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
