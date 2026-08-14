import { useState } from "react";
import { Delete20Regular, Edit20Regular } from "@fluentui/react-native-icons";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";
import { CityCustomerCard } from "@/src/features/cities/components/CityCustomerCard";
import { CityCustomerFilters } from "@/src/features/cities/components/CityCustomerFilters";
import { CityProductTotals } from "@/src/features/cities/components/CityProductTotals";
import { CitySelectionBar } from "@/src/features/cities/components/CitySelectionBar";
import { CitySummaryHeader } from "@/src/features/cities/components/CitySummaryHeader";
import { RenameCityDialog } from "@/src/features/cities/components/RenameCityDialog";
import { useCityCustomerSelection } from "@/src/features/cities/hooks/useCityCustomerSelection";
import { useCityCustomers } from "@/src/features/cities/hooks/useCityCustomers";

type CityCustomerListScreenProps = {
  normalizedCity: string;
};

export function CityCustomerListScreen(props: CityCustomerListScreenProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useTranslation("cities");
  const {
    loading,
    error,
    customers,
    searchTerm,
    setSearchTerm,
    status,
    setStatus,
    productTotals,
    completeOrder,
    completingOrderId,
    cityDisplayName,
    renaming,
    renameCity,
    deleting,
    deleteCity,
  } = useCityCustomers(props.normalizedCity);
  const selection = useCityCustomerSelection(customers);
  const [renameVisible, setRenameVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<string | null>(null);

  if (loading) {
    return <LoadingView label={t("customerList.loading")} />;
  }

  return (
    <ScreenContainer>
      <FlatList
        contentContainerStyle={styles.content}
        data={customers}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !error ? (
            <EmptyState message={t("customerList.emptyMessage")} title={t("customerList.emptyTitle")} />
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <CitySummaryHeader
              cityCount={customers.length}
              rightSlot={
                cityDisplayName ? (
                  <View style={styles.headerActions}>
                    <Pressable
                      onPress={() => setRenameVisible(true)}
                      style={[styles.iconButton, { backgroundColor: colors.primaryMuted, borderColor: colors.border }]}
                    >
                      <Edit20Regular color={colors.primary} />
                    </Pressable>
                    <Pressable
                      disabled={deleting}
                      onPress={() => setDeleteConfirmVisible(true)}
                      style={[styles.iconButton, { backgroundColor: colors.dangerBackground, borderColor: colors.border, opacity: deleting ? 0.5 : 1 }]}
                    >
                      <Delete20Regular color={colors.danger} />
                    </Pressable>
                  </View>
                ) : null
              }
              title={cityDisplayName || undefined}
            />
            <CityProductTotals totals={productTotals} />
            <CitySelectionBar selectedCount={selection.selectedCount} />
            <CityCustomerFilters
              onSearchTermChange={setSearchTerm}
              onStatusChange={setStatus}
              searchTerm={searchTerm}
              selectedStatus={status}
            />
            {error ? <ErrorState message={error} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <CityCustomerCard
            completing={completingOrderId === item.currentOpenOrderId}
            customer={item}
            onComplete={() => item.currentOpenOrderId && setCompleteTarget(item.currentOpenOrderId)}
            onPressDetails={() => router.push(`/customer/${item.id}`)}
            onToggleSelection={() => selection.toggleSelection(item.id)}
            selected={selection.isSelected(item.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
      <RenameCityDialog
        currentName={cityDisplayName}
        onCancel={() => setRenameVisible(false)}
        onSave={(newName) => {
          void renameCity(newName).then((newNormalizedCity) => {
            setRenameVisible(false);
            if (newNormalizedCity) {
              router.replace(`/city/${newNormalizedCity}`);
            }
          });
        }}
        saving={renaming}
        visible={renameVisible}
      />
      <ConfirmDialog
        destructive
        message={t("deleteCity.confirmMessage")}
        onCancel={() => setDeleteConfirmVisible(false)}
        onConfirm={() => {
          setDeleteConfirmVisible(false);
          void deleteCity().then((success) => {
            if (success) {
              router.back();
            }
          });
        }}
        title={t("deleteCity.confirmTitle")}
        visible={deleteConfirmVisible}
      />
      <ConfirmDialog
        destructive
        message={t("completeOrder.confirmMessage")}
        onCancel={() => setCompleteTarget(null)}
        onConfirm={() => {
          if (completeTarget) {
            void completeOrder(completeTarget);
          }
          setCompleteTarget(null);
        }}
        title={t("completeOrder.confirmTitle")}
        visible={Boolean(completeTarget)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    gap: 12,
    paddingBottom: 24,
  },
  header: {
    gap: 12,
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
