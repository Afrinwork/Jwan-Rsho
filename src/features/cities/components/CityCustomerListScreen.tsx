import { useMemo, useState } from "react";
import { Delete20Regular, Edit20Regular } from "@fluentui/react-native-icons";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { radius } from "@/src/theme/radius";
import { shadows } from "@/src/theme/shadows";
import { spacing } from "@/src/theme/spacing";
import { CityCustomerCard } from "@/src/features/cities/components/CityCustomerCard";
import { CityCustomerFilters } from "@/src/features/cities/components/CityCustomerFilters";
import { CityProductTotals } from "@/src/features/cities/components/CityProductTotals";
import { CitySelectionActionsBar } from "@/src/features/cities/components/CitySelectionActionsBar";
import { CitySelectionBar } from "@/src/features/cities/components/CitySelectionBar";
import { CitySummaryHeader } from "@/src/features/cities/components/CitySummaryHeader";
import { RenameCityDialog } from "@/src/features/cities/components/RenameCityDialog";
import { useCityCustomerSelection } from "@/src/features/cities/hooks/useCityCustomerSelection";
import { useCitySelectionActions } from "@/src/features/cities/hooks/useCitySelectionActions";
import { useCityCustomers } from "@/src/features/cities/hooks/useCityCustomers";

type CityCustomerListScreenProps = {
  normalizedCity: string;
};

export function CityCustomerListScreen(props: CityCustomerListScreenProps) {
  const router = useRouter();
  const { t } = useTranslation("cities");
  const {
    loading,
    error,
    customers,
    searchTerm,
    setSearchTerm,
    productTotals,
    completeOrder,
    completingOrderId,
    cityDisplayName,
    renaming,
    renameCity,
    deleting,
    deleteCity,
    reload,
  } = useCityCustomers(props.normalizedCity);
  const selection = useCityCustomerSelection(customers);
  const selectedCustomers = useMemo(
    () => customers.filter((customer) => selection.selectedIds.includes(customer.id)),
    [customers, selection.selectedIds],
  );
  const selectionActions = useCitySelectionActions({
    selectedCustomers,
    reload,
  });
  const [renameVisible, setRenameVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<string | null>(null);
  const [completeSelectionVisible, setCompleteSelectionVisible] = useState(false);

  if (loading) {
    return <LoadingView label={t("customerList.loading")} />;
  }

  return (
    <ScreenContainer contentStyle={styles.screenContent}>
      <FlatList
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
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
            <View
              style={[
                styles.topCard,
                {
                  backgroundColor: "#050816",
                  borderColor: "rgba(148, 163, 184, 0.18)",
                  shadowColor: "#020617",
                },
              ]}
            >
              <CitySummaryHeader
                cityCount={customers.length}
                inverted
                rightSlot={
                  cityDisplayName ? (
                    <View style={styles.headerActions}>
                      <Pressable
                        onPress={() => setRenameVisible(true)}
                        style={[
                          styles.iconButton,
                          styles.topCardButton,
                          {
                            backgroundColor: "rgba(255,255,255,0.08)",
                            borderColor: "rgba(255,255,255,0.14)",
                          },
                        ]}
                      >
                        <Edit20Regular color="#F8FAFC" />
                      </Pressable>
                      <Pressable
                        disabled={deleting}
                        onPress={() => setDeleteConfirmVisible(true)}
                        style={[
                          styles.iconButton,
                          styles.topCardButton,
                          {
                            backgroundColor: "rgba(127, 29, 29, 0.34)",
                            borderColor: "rgba(252, 165, 165, 0.2)",
                            opacity: deleting ? 0.5 : 1,
                          },
                        ]}
                      >
                        <Delete20Regular color="#FCA5A5" />
                      </Pressable>
                    </View>
                  ) : null
                }
                title={cityDisplayName || undefined}
              />
              <CityProductTotals embedded inverted totals={productTotals} />
            </View>
            <View style={styles.controlsRow}>
              <View style={styles.selectionColumn}>
                <CitySelectionBar
                  actionSlot={
                    selection.selectedCount > 0 ? (
                      <CitySelectionActionsBar
                        actionError={selectionActions.actionError}
                        completingAll={selectionActions.completingAll}
                        emailing={selectionActions.emailing}
                        onCompleteAll={() => setCompleteSelectionVisible(true)}
                        onShare={() => void selectionActions.share()}
                        onShareByEmail={() => void selectionActions.shareByEmail()}
                        selectedCount={selection.selectedCount}
                        sharing={selectionActions.sharing}
                      />
                    ) : null
                  }
                  allSelected={selection.allSelected}
                  onToggleSelectAll={selection.toggleSelectAll}
                  selectedCount={selection.selectedCount}
                  totalCount={customers.length}
                />
              </View>
              <View style={styles.searchColumn}>
                <CityCustomerFilters
                  onSearchTermChange={setSearchTerm}
                  searchTerm={searchTerm}
                />
              </View>
            </View>
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
      <ConfirmDialog
        destructive
        message={t("selectionActions.completeSelectedMessage")}
        onCancel={() => setCompleteSelectionVisible(false)}
        onConfirm={() => {
          setCompleteSelectionVisible(false);
          void selectionActions.completeAllOpenOrders().then((success) => {
            if (success) {
              selection.clearSelection();
            }
          });
        }}
        title={t("selectionActions.completeSelectedTitle", { count: selectionActions.selectedOpenCustomerCount })}
        visible={completeSelectionVisible}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    gap: 10,
    paddingBottom: 24,
  },
  screenContent: {
    paddingTop: 0,
  },
  header: {
    gap: 10,
    marginBottom: 8,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  selectionColumn: {
    flex: 1,
    minWidth: 220,
  },
  searchColumn: {
    flex: 1,
    minWidth: 220,
  },
  topCard: {
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.lg,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  topCardButton: {
    shadowColor: "transparent",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
