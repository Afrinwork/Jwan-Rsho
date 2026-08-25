import { Navigation20Regular } from "@fluentui/react-native-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppBadge } from "@/src/components/ui/AppBadge";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { CustomerOpenOrders } from "@/src/features/orders/hooks/useOpenOrdersOverview";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";
import { formatDate } from "@/src/utils/date";

type OpenOrdersCustomerCardProps = {
  group: CustomerOpenOrders;
  completingOrderId: string | null;
  deletingOrderId: string | null;
  onComplete: (orderId: string) => void;
  onDelete: (orderId: string) => void;
  onNavigate: () => void;
};

export function OpenOrdersCustomerCard({
  group,
  completingOrderId,
  deletingOrderId,
  onComplete,
  onDelete,
  onNavigate,
}: OpenOrdersCustomerCardProps) {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const { customer, orders } = group;

  return (
    <AppCard contentStyle={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="subheading">{customer.fullName}</AppText>
          <AppText color="muted" variant="caption">
            {[customer.address, customer.city].filter(Boolean).join(", ")}
          </AppText>
        </View>
        <Pressable
          onPress={onNavigate}
          style={[styles.navigateButton, { backgroundColor: colors.primaryMuted, borderColor: colors.border }]}
        >
          <Navigation20Regular color={colors.primary} />
        </Pressable>
      </View>
      <View style={styles.metaRow}>
        <AppBadge label={customer.city} tone="neutral" />
        {orders.length > 1 ? (
          <AppBadge label={t("openOrders.multipleOrdersBadge", { count: orders.length })} tone="primary" />
        ) : null}
      </View>
      {orders.map((order, index) => {
        const isCompleting = completingOrderId === order.id;
        const isDeleting = deletingOrderId === order.id;
        const isBusy = isCompleting || isDeleting;

        return (
          <View
            key={order.id}
            style={[styles.orderBlock, index > 0 ? [styles.orderBlockDivider, { borderTopColor: colors.border }] : null]}
          >
            <AppBadge label={t("openOrders.orderDateLabel", { date: formatDate(order.orderedAt) })} tone="secondary" />
            <View style={styles.items}>
              {order.items.map((item) => (
                <View
                  key={item.id}
                  style={[styles.itemChip, { backgroundColor: colors.successBackground, borderColor: colors.successBorder }]}
                >
                  <AppText color="success" variant="caption">
                    {item.productNameSnapshot}: {item.quantity} {item.unit}
                  </AppText>
                </View>
              ))}
            </View>
            <View style={styles.actions}>
              <View style={styles.actionButton}>
                <AppButton
                  disabled={isBusy}
                  label={t("openOrders.completeButton")}
                  loading={isCompleting}
                  onPress={() => onComplete(order.id)}
                  size="compact"
                />
              </View>
              <View style={styles.actionButton}>
                <AppButton
                  disabled={isBusy}
                  label={t("openOrders.deleteButton")}
                  loading={isDeleting}
                  onPress={() => onDelete(order.id)}
                  size="compact"
                  variant="danger"
                />
              </View>
            </View>
          </View>
        );
      })}
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
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  navigateButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  orderBlock: {
    gap: 6,
  },
  orderBlockDivider: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  items: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  itemChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: 2,
  },
  actionButton: {
    flex: 1,
  },
});
