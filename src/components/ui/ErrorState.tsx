import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppBadge } from "@/src/components/ui/AppBadge";
import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

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
      <AppBadge label="Kurz stoppen" tone="danger" />
      <AppText color="danger" variant="body">
        {buildErrorMessage(message)}
      </AppText>
    </View>
  );
}

function buildErrorMessage(message: string) {
  return `Fast geschafft. ${message}`;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: 6,
  },
});
