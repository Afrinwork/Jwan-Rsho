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

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <AppText color={inverted ? "#F8FAFC" : "default"} style={styles.title} variant="heading">
          {title ?? t("summary.defaultTitle")}
        </AppText>
        {rightSlot}
      </View>
      <AppText color={inverted ? "rgba(226, 232, 240, 0.92)" : "muted"} numberOfLines={2} style={styles.subtitle} variant="caption">
        {subtitle ?? t("summary.defaultSubtitle")}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  title: {},
  subtitle: {},
});
