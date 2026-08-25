import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/theme/spacing";

type CitySummaryHeaderProps = {
  cityCount: number;
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  inverted?: boolean;
};

export function CitySummaryHeader({ cityCount, title, subtitle, rightSlot, inverted = false }: CitySummaryHeaderProps) {
  const { t } = useTranslation("cities");
  const resolvedSubtitle = subtitle ?? t("summary.defaultSubtitle");

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <AppText color={inverted ? "#F8FAFC" : "default"} style={[styles.title, styles.copy]} variant="heading">
          {title ?? t("summary.defaultTitle")}
        </AppText>
        {rightSlot}
      </View>
      {resolvedSubtitle.trim() ? (
        <AppText color={inverted ? "rgba(226, 232, 240, 0.92)" : "muted"} numberOfLines={2} style={styles.subtitle} variant="caption">
          {resolvedSubtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  copy: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  title: {},
  subtitle: {},
});
