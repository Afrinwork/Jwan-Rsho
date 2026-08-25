import { AddCircle20Regular, ChevronDown20Regular } from "@fluentui/react-native-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { FormField } from "@/src/components/forms/FormField";
import { AppInput } from "@/src/components/ui/AppInput";
import { spacing } from "@/src/constants/spacing";
import { useCustomerCities } from "@/src/features/customers/hooks/useCustomerCities";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";

type CitySelectFieldProps = {
  value: string;
  onChange: (value: string) => void;
  country: string;
  error?: string;
};

export function CitySelectField({ value, onChange, country, error }: CitySelectFieldProps) {
  const { cities, loading } = useCustomerCities();
  const colors = useThemeColors();
  const { t } = useTranslation("customers");
  const [open, setOpen] = useState(false);
  const options = cities.filter((city) => !country || city.country === country);
  const normalizedValue = value.trim().toLowerCase();
  const isNewCity = normalizedValue.length > 0 && !options.some((option) => option.city.trim().toLowerCase() === normalizedValue);

  return (
    <FormField error={error} label={t("form.cityLabel")}>
      <View style={styles.container}>
        <AppInput
          autoCapitalize="words"
          onChangeText={onChange}
          placeholder={t("form.cityPlaceholder")}
          value={value}
        />
        {loading ? (
          <Text style={[styles.hint, { color: colors.mutedText }]}>{t("city.loadingHint")}</Text>
        ) : options.length > 0 ? (
          <>
            <Pressable
              onPress={() => setOpen(true)}
              style={[styles.trigger, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            >
              <Text numberOfLines={1} style={[styles.triggerLabel, { color: colors.text }]}>
                {value || t("form.cityPlaceholder")}
              </Text>
              <ChevronDown20Regular color={colors.mutedText} />
            </Pressable>
            <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
              <View style={styles.overlay}>
                <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
                    {options.map((option) => {
                      const active = option.city === value;
                      return (
                        <Pressable
                          key={`${option.country}-${option.normalizedCity}`}
                          onPress={() => {
                            onChange(option.city);
                            setOpen(false);
                          }}
                          style={[
                            styles.option,
                            {
                              borderColor: active ? colors.primary : colors.border,
                              backgroundColor: active ? colors.primaryMuted : colors.surfaceElevated,
                            },
                          ]}
                        >
                          <Text style={[styles.optionLabel, { color: active ? colors.primary : colors.text }]}>
                            {option.city}
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
        ) : null}
        {isNewCity ? (
          <View style={[styles.addRow, { backgroundColor: colors.primaryMuted, borderColor: colors.border }]}>
            <View style={styles.addCopy}>
              <View style={styles.iconWrap}>
                <AddCircle20Regular color={colors.primary} />
              </View>
              <Text style={[styles.addText, { color: colors.text }]}>{t("city.addNew", { city: value.trim() })}</Text>
            </View>
            <AppButton label={t("city.apply")} onPress={() => onChange(value.trim())} />
          </View>
        ) : null}
      </View>
    </FormField>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
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
  hint: { fontSize: 13, lineHeight: 18 },
});
