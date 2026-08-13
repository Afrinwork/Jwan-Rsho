import { useState } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FormField } from "@/src/components/forms/FormField";
import { AppInput } from "@/src/components/ui/AppInput";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type LocalizedNameFieldProps<T extends FieldValues> = {
  control: Control<T>;
  nameField: Path<T>;
  arField: Path<T>;
  label: string;
  namePlaceholder?: string;
  arPlaceholder?: string;
  nameError?: string;
  arError?: string;
};

export function LocalizedNameField<T extends FieldValues>({
  control,
  nameField,
  arField,
  label,
  namePlaceholder,
  arPlaceholder,
  nameError,
  arError,
}: LocalizedNameFieldProps<T>) {
  const colors = useThemeColors();
  const [activeLang, setActiveLang] = useState<"de" | "ar">("de");

  return (
    <FormField error={activeLang === "de" ? nameError : arError} label={label}>
      <View style={styles.tabRow}>
        {(["de", "ar"] as const).map((lang) => {
          const active = activeLang === lang;
          return (
            <Pressable
              key={lang}
              onPress={() => setActiveLang(lang)}
              style={[
                styles.tab,
                { borderColor: colors.border, backgroundColor: active ? colors.primary : colors.surfaceMuted },
              ]}
            >
              <Text style={[styles.tabLabel, { color: active ? colors.primaryContrast : colors.mutedText }]}>
                {lang === "de" ? "DE" : "AR"}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {activeLang === "de" ? (
        <Controller
          control={control}
          name={nameField}
          render={({ field }) => (
            <AppInput
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder={namePlaceholder}
              value={(field.value as string | undefined) ?? ""}
            />
          )}
        />
      ) : (
        <Controller
          control={control}
          name={arField}
          render={({ field }) => (
            <AppInput
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder={arPlaceholder}
              style={styles.arInput}
              value={(field.value as string | undefined) ?? ""}
            />
          )}
        />
      )}
    </FormField>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: "row", gap: 6, marginBottom: 6 },
  tab: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  tabLabel: { fontSize: 12, fontWeight: "700" },
  arInput: { textAlign: "right", writingDirection: "rtl" },
});
