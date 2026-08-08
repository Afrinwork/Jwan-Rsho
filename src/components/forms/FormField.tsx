import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/src/hooks/useThemeColors";

type FormFieldProps = PropsWithChildren<{
  label: string;
  error?: string;
}>;

export function FormField({ label, error, children }: FormFieldProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.mutedText }]}>{label}</Text>
      {children}
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
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
});
