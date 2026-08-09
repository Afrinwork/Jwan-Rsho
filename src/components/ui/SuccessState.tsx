import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/src/constants/spacing";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type SuccessStateProps = {
  message: string;
  durationMs?: number;
};

const DEFAULT_DURATION_MS = 3200;

export function SuccessState({ message, durationMs = DEFAULT_DURATION_MS }: SuccessStateProps) {
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
    <View style={[styles.container, { backgroundColor: colors.successBackground, borderColor: colors.successBorder }]}>
      <Text style={[styles.eyebrow, { color: colors.success }]}>Stark</Text>
      <Text style={[styles.label, { color: colors.success }]}>{buildSuccessMessage(message)}</Text>
    </View>
  );
}

function buildSuccessMessage(message: string) {
  return `Sehr gut. ${message}`;
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
