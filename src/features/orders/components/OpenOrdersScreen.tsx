import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/src/components/ui/AppText";
import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
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
  const preferredNavigationApp = useAppStore((state) => state.preferredNavigationApp);
  const { groups, cities, loading, error, actionError, completeOrder, deleteOrder } = useOpenOrdersOverview();
  const [selectedCity, setSelectedCity] = useState(ALL_CITIES);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [navigationApps, setNavigationApps] = useState<MapNavigationApp[] | null>(null);
  const [navigationTargetAddress, setNavigationTargetAddress] = useState<string | null>(null);

  const filteredGroups = useMemo(
    () => (selectedCity === ALL_CITIES ? groups : groups.filter((group) => group.customer.city.trim() === selectedCity)),
    [groups, selectedCity],
  );

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
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CompactScreenHeader subtitle={t("openOrders.screenSubtitle")} title={t("openOrders.screenTitle")} />
        {error ? <ErrorState message={error} /> : null}
        {actionError ? <ErrorState message={actionError} /> : null}
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
                group={group}
                key={group.customer.id}
                onComplete={(orderId) => void completeOrder(orderId)}
                onDelete={(orderId) => setDeleteTarget(orderId)}
                onNavigate={() => void handleNavigate(group)}
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
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  list: {
    gap: spacing.sm,
  },
});
