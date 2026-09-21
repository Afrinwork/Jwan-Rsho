import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppInput } from "@/src/components/ui/AppInput";
import { AppText } from "@/src/components/ui/AppText";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { spacing } from "@/src/theme/spacing";

import { CompletedTodayEntryCard } from "@/src/features/overview/components/CompletedTodayEntryCard";
import { useCompletedTodayOrders } from "@/src/features/overview/hooks/useCompletedTodayOrders";

export function CompletedTodaySection() {
  const { t } = useTranslation("overview");
  const {
    entries,
    totalCount,
    error,
    searchTerm,
    setSearchTerm,
    deletingOrderId,
    deletingAll,
    actionError,
    deleteEntry,
    deleteAll,
  } = useCompletedTodayOrders();
  const [deleteAllConfirmVisible, setDeleteAllConfirmVisible] = useState(false);

  return (
    <AppCard contentStyle={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="subheading">{t("completedToday.title")}</AppText>
          <AppText color="muted" variant="caption">
            {t("completedToday.count", { count: totalCount })}
          </AppText>
        </View>
        {totalCount > 0 ? (
          <AppButton
            disabled={deletingAll}
            label={t("completedToday.deleteAll")}
            loading={deletingAll}
            onPress={() => setDeleteAllConfirmVisible(true)}
            size="compact"
            variant="danger"
          />
        ) : null}
      </View>
      {totalCount > 0 ? (
        <AppInput
          onChangeText={setSearchTerm}
          placeholder={t("completedToday.searchPlaceholder")}
          style={styles.searchInput}
          value={searchTerm}
        />
      ) : null}
      {error ? <ErrorState message={error} /> : null}
      {actionError ? <ErrorState message={actionError} /> : null}
      {totalCount === 0 ? (
        <AppText color="muted" variant="body">
          {t("completedToday.emptyMessage")}
        </AppText>
      ) : entries.length === 0 ? (
        <AppText color="muted" variant="body">
          {t("completedToday.noSearchResults")}
        </AppText>
      ) : (
        <View style={styles.list}>
          {entries.map((entry) => (
            <CompletedTodayEntryCard
              deleting={deletingOrderId === entry.orderId}
              entry={entry}
              key={entry.orderId}
              onDelete={() => void deleteEntry(entry.orderId)}
            />
          ))}
        </View>
      )}
      <ConfirmDialog
        destructive
        message={t("completedToday.deleteAllConfirmMessage")}
        onCancel={() => setDeleteAllConfirmVisible(false)}
        onConfirm={() => {
          setDeleteAllConfirmVisible(false);
          void deleteAll();
        }}
        title={t("completedToday.deleteAllConfirmTitle")}
        visible={deleteAllConfirmVisible}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  searchInput: {
    paddingVertical: 11,
  },
  list: {
    gap: spacing.xs,
  },
});
