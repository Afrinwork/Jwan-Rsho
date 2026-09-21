import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
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
import { NavigationAppSheet } from "@/src/features/map/components/NavigationAppSheet";
import { MapNavigationApp, NavigationAppId } from "@/src/features/map/types/mapTypes";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { geocodingService } from "@/src/services/geocodingService";
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
  const [navigationApps, setNavigationApps] = useState<MapNavigationApp[] | null>(null);
  const [navigationTargetAddress, setNavigationTargetAddress] = useState<string | null>(null);

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
    const address = geocodingService.composeAddress({
      address: group.customer.address,
      city: group.customer.city,
      country: group.customer.country,
      region: group.customer.region,
    });
    const apps = await navigationService.getNavigationApps({ address }, preferredNavigationApp);
    setNavigationTargetAddress(address);
    setNavigationApps(apps);
  }

  function handleSelectNavigationApp(appId: NavigationAppId) {
    if (navigationTargetAddress) {
      void navigationService.openNavigationApp(appId, { address: navigationTargetAddress });
    }
    setNavigationApps(null);
    setNavigationTargetAddress(null);
  }

  if (loading) {
    return <LoadingView label={t("openOrders.loading")} />;
  }

  return (
    <ScreenContainer contentStyle={styles.screenContent}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
        {filteredGroups.length === 0 ? (
          <EmptyState message={t("openOrders.emptyMessage")} title={t("openOrders.emptyTitle")} />
        ) : (
          <View style={styles.list}>
            {filteredGroups.map((group) => (
              <OpenOrdersCustomerCard
                completingOrderId={pendingActionType === "complete" ? pendingActionOrderId : null}
                deletingOrderId={pendingActionType === "delete" ? pendingActionOrderId : null}
                group={group}
                key={group.customer.id}
                onComplete={(orderId) => void completeOrder(orderId)}
                onDelete={(orderId) => setDeleteTarget(orderId)}
                onNavigate={() => void handleNavigate(group)}
                onToggleSelected={() => toggleCustomerSelection(group.customer.id)}
                selected={selectedCustomerIds.has(group.customer.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
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
      <NavigationAppSheet
        apps={navigationApps ?? []}
        onClose={() => {
          setNavigationApps(null);
          setNavigationTargetAddress(null);
        }}
        onSelect={handleSelectNavigationApp}
        visible={navigationApps !== null}
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
  list: {
    gap: spacing.sm,
  },
});
