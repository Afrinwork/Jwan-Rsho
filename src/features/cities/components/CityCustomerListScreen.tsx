import { useMemo, useState } from "react";
import { Delete20Regular, Edit20Regular } from "@fluentui/react-native-icons";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { AppCard } from "@/src/components/ui/AppCard";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
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
    deletingCustomerId,
    deleteCustomer,
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
  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState<string | null>(null);

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
            <AppCard contentStyle={styles.topCard}>
              <CitySummaryHeader
                cityCount={customers.length}
                subtitle=""
                rightSlot={
                  cityDisplayName ? (
                    <View style={styles.headerActions}>
                      <Pressable
                        onPress={() => setRenameVisible(true)}
                        style={[
                          styles.iconButton,
                          styles.topCardButton,
                          {
                            backgroundColor: "#FFFFFF",
                            borderColor: "rgba(15, 23, 42, 0.1)",
                          },
                        ]}
                      >
                        <Edit20Regular color="#111111" />
                      </Pressable>
                      <Pressable
                        disabled={deleting}
                        onPress={() => setDeleteConfirmVisible(true)}
                        style={[
                          styles.iconButton,
                          styles.topCardButton,
                          {
                            backgroundColor: "#FFFFFF",
                            borderColor: "rgba(239, 68, 68, 0.16)",
                            opacity: deleting ? 0.5 : 1,
                          },
                        ]}
                      >
                        <Delete20Regular color="#DC2626" />
                      </Pressable>
                    </View>
                  ) : null
                }
                title={cityDisplayName || undefined}
              />
            </AppCard>
            {productTotals.length ? <CityProductTotals embedded totals={productTotals} /> : null}
            <AppCard contentStyle={styles.controlsCard}>
              <CityCustomerFilters onSearchTermChange={setSearchTerm} searchTerm={searchTerm} />
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
            </AppCard>
            {error ? <ErrorState message={error} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <CityCustomerCard
            completing={completingOrderId === item.currentOpenOrderId}
            customer={item}
            deleting={deletingCustomerId === item.id}
            onComplete={() => item.currentOpenOrderId && setCompleteTarget(item.currentOpenOrderId)}
            onDelete={() => setDeleteCustomerTarget(item.id)}
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
        message={t("deleteCustomer.confirmMessage")}
        onCancel={() => setDeleteCustomerTarget(null)}
        onConfirm={() => {
          const target = deleteCustomerTarget;
          setDeleteCustomerTarget(null);
          if (target) {
            void deleteCustomer(target);
          }
        }}
        title={t("deleteCustomer.confirmTitle")}
        visible={Boolean(deleteCustomerTarget)}
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
  topCard: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  controlsCard: {
    padding: spacing.sm,
    gap: spacing.sm,
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
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
