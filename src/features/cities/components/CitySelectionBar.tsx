import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type CitySelectionBarProps = {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  hasSelection: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
};

export function CitySelectionBar(props: CitySelectionBarProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("cities");

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
        },
      ]}
    >
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
          disabled={!props.totalCount || props.allSelected}
          onPress={props.onSelectAll}
          style={[
            styles.actionChip,
            {
              backgroundColor: props.allSelected ? colors.primaryMuted : colors.surface,
              borderColor: props.allSelected ? colors.primary : colors.border,
              opacity: !props.totalCount || props.allSelected ? 0.65 : 1,
            },
          ]}
        >
          <AppText color={props.allSelected ? "primary" : "default"} style={styles.actionText} variant="caption">
            {t("selectionBar.selectAll")}
          </AppText>
        </Pressable>
        {props.hasSelection ? (
          <Pressable
            onPress={props.onClearSelection}
            style={[
              styles.actionChip,
              {
                backgroundColor: colors.dangerBackground,
                borderColor: colors.dangerBorder,
              },
            ]}
          >
            <AppText color="danger" style={styles.actionText} variant="caption">
              {t("selectionBar.clearSelection")}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
