import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { routeT } from "@/src/features/route/i18n/routeT";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type RouteSelectionBarProps = {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  actionSlot?: ReactNode;
};

export function RouteSelectionBar(props: RouteSelectionBarProps) {
  const colors = useThemeColors();
  const t = routeT;

  return (
    <AppCard
      contentStyle={styles.container}
      frosted
      style={[
        styles.cardFrame,
        {
          backgroundColor: "#F8E0CF",
          borderColor: colors.primaryStrong,
          shadowColor: colors.primary,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.countChip, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryStrong }]}>
          <AppText color="primary" style={styles.countText} variant="bodyMedium">
            {props.selectedCount}/{props.totalCount}
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
  cardFrame: { borderRadius: radius.xl, padding: 2, borderWidth: 1 },
  container: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, gap: spacing.xs },
  topRow: { flexDirection: "row", gap: spacing.xs, alignItems: "center", flexWrap: "wrap" },
  countChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  actionChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  countText: { fontSize: 13, fontWeight: "700" },
  actionText: { fontWeight: "700" },
});
