import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/src/components/ui/AppText";
import { CustomerListMode } from "@/src/features/management/hooks/useManagementCustomers";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type CustomerListTabsProps = {
  mode: CustomerListMode;
  totalCount: number;
  openOrdersCustomerCount: number;
  onChange: (mode: CustomerListMode) => void;
};

export function CustomerListTabs({ mode, totalCount, openOrdersCustomerCount, onChange }: CustomerListTabsProps) {
  const { t } = useTranslation("management");
  const colors = useThemeColors();

  return (
    <View style={[styles.tabs, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <CustomerTab active={mode === "all"} count={totalCount} label={t("customersScreen.tabs.all")} mode="all" onPress={onChange} />
      <CustomerTab active={mode === "openOrders"} count={openOrdersCustomerCount} label={t("customersScreen.tabs.openOrders")} mode="openOrders" onPress={onChange} />
    </View>
  );
}

type CustomerTabProps = {
  active: boolean;
  count: number;
  label: string;
  mode: CustomerListMode;
  onPress: (mode: CustomerListMode) => void;
};

function CustomerTab({ active, count, label, mode, onPress }: CustomerTabProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={() => onPress(mode)}
      style={({ pressed }) => [
        styles.tab,
        {
          backgroundColor: active ? colors.surfaceElevated : "transparent",
          borderColor: active ? colors.borderStrong : "transparent",
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <AppText color={active ? "default" : "muted"} numberOfLines={2} style={styles.tabLabel} variant="label">
        {label}
      </AppText>
      <AppText color={active ? "default" : "muted"} variant="caption">
        {count}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: {
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  tab: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  tabLabel: {
    textAlign: "center",
  },
});
