import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type CitySelectionBarProps = {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  actionSlot?: ReactNode;
};

export function CitySelectionBar(props: CitySelectionBarProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("cities");

  return (
    <AppCard contentStyle={styles.container}>
      <View style={styles.row}>
        <View
          style={[
            styles.countChip,
            {
              backgroundColor: colors.backgroundAccent,
              borderColor: colors.primary,
            },
          ]}
        >
          <AppText color="primary" style={styles.countText} variant="bodyMedium">
            {t("selectionBar.selectedCount", { count: props.selectedCount })}
          </AppText>
        </View>
        <Pressable
          disabled={!props.totalCount}
          onPress={props.onToggleSelectAll}
          style={[
            styles.actionChip,
            {
              backgroundColor: props.allSelected ? colors.primaryMuted : colors.surface,
              borderColor: props.allSelected ? colors.primary : colors.border,
              opacity: !props.totalCount ? 0.65 : 1,
            },
          ]}
        >
          <AppText color={props.allSelected ? "primary" : "default"} style={styles.actionText} variant="caption">
            {props.allSelected ? t("selectionBar.clearSelection") : t("selectionBar.selectAll")}
          </AppText>
        </Pressable>
        {props.actionSlot}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
    flexWrap: "wrap",
  },
  countChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  countText: {
    fontSize: 13,
    fontWeight: "700",
  },
  actionText: {
    fontWeight: "700",
  },
});
