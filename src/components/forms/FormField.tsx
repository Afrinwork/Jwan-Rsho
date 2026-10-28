import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/src/hooks/useThemeColors";

type FormFieldProps = PropsWithChildren<{
  label: string;
  error?: string;
  // Small helper text under the input, hidden while an error is shown.
  hint?: string;
}>;

export function FormField({ label, error, hint, children }: FormFieldProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.mutedText }]}>{label}</Text>
      {children}
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: colors.mutedText }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  error: {
    fontSize: 13,
  },
  hint: {
    fontSize: 12,
  },
});
