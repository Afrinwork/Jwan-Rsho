import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/src/components/ui/AppText";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SearchInput } from "@/src/components/ui/SearchInput";
import { SuccessState } from "@/src/components/ui/SuccessState";
import { AppButton } from "@/src/components/ui/AppButton";
import { CustomerOpenOrders, useOpenOrdersOverview } from "@/src/features/orders/hooks/useOpenOrdersOverview";
import { OpenOrdersCustomerCard } from "@/src/features/orders/components/OpenOrdersCustomerCard";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { navigationService } from "@/src/services/navigationService";
import { useAppStore } from "@/src/store/appStore";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

const ALL_CITIES = "__all__";

export function OpenOrdersScreen() {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const preferredNavigationApp = useAppStore((state) => state.preferredNavigationApp);
  const {
    groups,
    cities,
    loading,
    error,
    actionError,
    actionSuccess,
    completeOrder,
    completeOrders,
    deleteOrder,
    pendingActionOrderId,
    pendingActionType,
  } = useOpenOrdersOverview();
  const [selectedCity, setSelectedCity] = useState(ALL_CITIES);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const cityGroups = selectedCity === ALL_CITIES ? groups : groups.filter((group) => group.customer.city.trim() === selectedCity);

    if (!term) {
      return cityGroups;
    }

    return cityGroups.filter((group) =>
      [
        group.customer.fullName,
        group.customer.phone,
        group.customer.address,
        group.customer.city,
        ...group.orders.flatMap((order) => order.items.map((item) => item.productNameSnapshot)),
      ].some((value) => value.toLowerCase().includes(term)),
    );
  }, [groups, searchTerm, selectedCity]);

  const selectedGroups = useMemo(
    () => groups.filter((group) => selectedCustomerIds.has(group.customer.id)),
    [groups, selectedCustomerIds],
  );
  const selectedOrderIds = useMemo(
    () => selectedGroups.flatMap((group) => group.orders.map((order) => order.id)),
    [selectedGroups],
  );
  const isCompletingMany = pendingActionType === "completeMany";

  function toggleCustomerSelection(customerId: string) {
    setSelectedCustomerIds((current) => {
      const next = new Set(current);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  }

  async function handleCompleteSelected() {
    await completeOrders(selectedOrderIds);
    setSelectedCustomerIds(new Set());
  }

  async function handleNavigate(group: CustomerOpenOrders) {
    // Only the order's address field — city and country are left out.
    const address = group.customer.address?.trim();
    if (!address) return;
    // Opens the navigation app chosen in Settings directly.
    await navigationService.openNavigationApp(preferredNavigationApp, { address });
  }

  if (loading) {
    return <LoadingView label={t("openOrders.loading")} />;
  }

  return (
    <ScreenContainer contentStyle={styles.screenContent}>
      {/* Virtualized: only the cards on screen are rendered, so a long day
          of open orders stays smooth on slower phones. */}
      <FlatList
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={<EmptyState message={t("openOrders.emptyMessage")} title={t("openOrders.emptyTitle")} />}
        ListHeaderComponent={
          <View style={styles.content}>
            {error ? <ErrorState message={error} /> : null}
            {actionError ? <ErrorState message={actionError} /> : null}
            {actionSuccess ? <SuccessState message={actionSuccess} /> : null}
            <SearchInput onChangeText={setSearchTerm} placeholder={t("openOrders.searchPlaceholder")} value={searchTerm} />
            {selectedOrderIds.length ? (
              <View style={[styles.selectionBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <AppText color="muted" style={styles.selectionText} variant="bodyMedium">
                  {t("openOrders.selectedSummary", { count: selectedOrderIds.length })}
                </AppText>
                <View style={styles.selectionActions}>
                  <AppButton label={t("openOrders.clearSelection")} onPress={() => setSelectedCustomerIds(new Set())} size="compact" variant="secondary" />
                  <AppButton label={t("openOrders.completeSelected")} loading={isCompletingMany} onPress={() => void handleCompleteSelected()} size="compact" />
                </View>
              </View>
            ) : null}
            {cities.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterRow}>
                  <CityChip active={selectedCity === ALL_CITIES} label={t("openOrders.filterAll")} onPress={() => setSelectedCity(ALL_CITIES)} />
                  {cities.map((city) => (
                    <CityChip active={selectedCity === city} key={city} label={city} onPress={() => setSelectedCity(city)} />
                  ))}
                </View>
              </ScrollView>
            ) : null}
          </View>
        }
        contentContainerStyle={styles.listContent}
        data={filteredGroups}
        extraData={[pendingActionType, pendingActionOrderId, selectedCustomerIds]}
        initialNumToRender={8}
        keyExtractor={(group) => group.customer.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: group }) => (
          <OpenOrdersCustomerCard
            completingOrderId={pendingActionType === "complete" ? pendingActionOrderId : null}
            deletingOrderId={pendingActionType === "delete" ? pendingActionOrderId : null}
            group={group}
            onComplete={(orderId) => void completeOrder(orderId)}
            onDelete={(orderId) => setDeleteTarget(orderId)}
            onNavigate={() => void handleNavigate(group)}
            onToggleSelected={() => toggleCustomerSelection(group.customer.id)}
            selected={selectedCustomerIds.has(group.customer.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
        windowSize={7}
      />
      <ConfirmDialog
        destructive
        message={t("openOrders.deleteConfirmMessage")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void deleteOrder(deleteTarget);
          }
          setDeleteTarget(null);
        }}
        title={t("openOrders.deleteConfirmTitle")}
        visible={Boolean(deleteTarget)}
      />
    </ScreenContainer>
  );
}

type CityChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function CityChip({ label, active, onPress }: CityChipProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primaryStrong : colors.border,
        },
      ]}
    >
      <AppText color={active ? colors.primaryContrast : colors.text} variant="bodyMedium">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingTop: 0,
  },
  content: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  selectionBar: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  selectionText: {
    textAlign: "center",
  },
  selectionActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  separator: {
    height: spacing.sm,
  },
});

function ListSeparator() {
  return <View style={styles.separator} />;
}
