import { useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SearchInput } from "@/src/components/ui/SearchInput";
import { spacing } from "@/src/constants/spacing";
import { routes } from "@/src/constants/routes";
import { ManagementCustomerCard } from "@/src/features/management/components/ManagementCustomerCard";
import { CustomerListTabs } from "@/src/features/management/components/CustomerListTabs";
import { useManagementCustomers } from "@/src/features/management/hooks/useManagementCustomers";

export function CustomerManagementScreen() {
  const router = useRouter();
  const { t } = useTranslation("management");
  const {
    customers,
    error,
    loading,
    query,
    setQuery,
    totalCount,
    openOrdersCustomerCount,
    mode,
    setMode,
    deletingId,
    deleteCustomer,
  } = useManagementCustomers();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  if (loading) {
    return <LoadingView label={t("customersScreen.loading")} />;
  }

  // Virtualized: only the cards on screen are rendered, so hundreds of
  // customers (and typing in the search) stay smooth on slower phones.
  const listHeader = (
    <View style={styles.header}>
      <CompactScreenHeader subtitle={t("customersScreen.subtitle")} title={t("customersScreen.title")} />
      <CustomerListTabs mode={mode} onChange={setMode} openOrdersCustomerCount={openOrdersCustomerCount} totalCount={totalCount} />
      <View style={styles.searchWrap}>
        <SearchInput onChangeText={setQuery} value={query} />
      </View>
      {error ? <ErrorState message={error} /> : null}
    </View>
  );

  return (
    <ScreenContainer>
      <FlatList
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={
          <EmptyState
            message={t(mode === "openOrders" ? "customersScreen.emptyOpenOrdersMessage" : "customersScreen.emptyMessage")}
            title={t(mode === "openOrders" ? "customersScreen.emptyOpenOrdersTitle" : "customersScreen.emptyTitle")}
          />
        }
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.content}
        data={customers}
        initialNumToRender={12}
        keyExtractor={(customer) => customer.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: customer }) => (
          <ManagementCustomerCard
            customer={customer}
            deleting={deletingId === customer.id}
            onDelete={() => setDeleteTarget(customer.id)}
            onPress={() => router.push(`${routes.customerEditBase}/${customer.id}` as never)}
          />
        )}
        showsVerticalScrollIndicator={false}
        windowSize={7}
      />
      <ConfirmDialog
        destructive
        message={t("customersScreen.deleteConfirmMessage")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const target = deleteTarget;
          setDeleteTarget(null);
          if (target) {
            void deleteCustomer(target);
          }
        }}
        title={t("customersScreen.deleteConfirmTitle")}
        visible={Boolean(deleteTarget)}
      />
    </ScreenContainer>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  searchWrap: {
    marginTop: -spacing.sm,
  },
  separator: {
    height: spacing.sm,
  },
});
