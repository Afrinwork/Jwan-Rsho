import { CheckmarkCircle20Filled } from "@fluentui/react-native-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";
import { formatDate, formatTime } from "@/src/utils/date";

import { CompletedTodayEntry } from "@/src/features/overview/types/completedTodayTypes";

type CompletedTodayEntryCardProps = {
  entry: CompletedTodayEntry;
  deleting: boolean;
  onDelete: () => void;
  showDate?: boolean;
};

export function CompletedTodayEntryCard({ entry, deleting, onDelete, showDate = false }: CompletedTodayEntryCardProps) {
  const { t } = useTranslation("overview");
  const colors = useThemeColors();
  const location = [entry.address, entry.city].filter(Boolean).join(", ");

  return (
    <View style={[styles.row, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <CheckmarkCircle20Filled color={colors.success} />
      <View style={styles.info}>
        <AppText numberOfLines={1} variant="bodyMedium">
          {entry.customerName}
        </AppText>
        <AppText color="muted" numberOfLines={1} variant="caption">
          {showDate ? `${formatDate(entry.completedAt)} ` : ""}
          {formatTime(entry.completedAt)}
          {location ? ` · ${location}` : ""}
          {" · "}
          {t("completedToday.itemCount", { count: entry.itemCount })}
        </AppText>
        {entry.items.length > 0 ? (
          <View style={[styles.items, { borderTopColor: colors.border }]}>
            {entry.items.map((item, index) => (
              <AppText key={`${item.name}-${index}`} numberOfLines={1} variant="caption">
                {item.name}: {item.quantity} {item.unit}
              </AppText>
            ))}
          </View>
        ) : null}
      </View>
      <Pressable disabled={deleting} hitSlop={8} onPress={onDelete} style={styles.deleteButton}>
        <AppText color={deleting ? "muted" : "danger"} variant="caption">
          {t("completedToday.deleteEntry")}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  items: {
    borderTopWidth: 1,
    gap: 2,
    marginTop: spacing.xxs,
    paddingTop: spacing.xs,
  },
  deleteButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
});
