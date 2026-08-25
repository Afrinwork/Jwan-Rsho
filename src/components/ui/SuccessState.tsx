import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppBadge } from "@/src/components/ui/AppBadge";
import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type SuccessStateProps = {
  message: string;
  durationMs?: number;
};

const DEFAULT_DURATION_MS = 3200;

export function SuccessState({ message, durationMs = DEFAULT_DURATION_MS }: SuccessStateProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("common");
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
      <AppBadge label={t("successBadge")} tone="success" />
      <AppText color="success" variant="body">{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: 6,
  },
});
