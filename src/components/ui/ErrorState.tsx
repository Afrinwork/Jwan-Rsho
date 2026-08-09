import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type ErrorStateProps = {
  message: string;
  durationMs?: number;
};

const DEFAULT_DURATION_MS = 3600;

export function ErrorState({ message, durationMs = DEFAULT_DURATION_MS }: ErrorStateProps) {
  const colors = useThemeColors();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timeoutId = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(timeoutId);
  }, [durationMs, message]);

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.dangerBackground, borderColor: colors.dangerBorder }]}>
      <Text style={[styles.eyebrow, { color: colors.danger }]}>Kurz stoppen</Text>
      <Text style={[styles.label, { color: colors.danger }]}>{buildErrorMessage(message)}</Text>
    </View>
  );
}

function buildErrorMessage(message: string) {
  return `Fast geschafft. ${message}`;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  label: {
    fontSize: 14,
    lineHeight: 21,
  },
});
