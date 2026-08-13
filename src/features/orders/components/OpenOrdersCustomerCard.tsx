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
  onComplete: (orderId: string) => void;
  onDelete: (orderId: string) => void;
  onNavigate: () => void;
};

export function OpenOrdersCustomerCard({ group, onComplete, onDelete, onNavigate }: OpenOrdersCustomerCardProps) {
  const { t } = useTranslation("orders");
  const colors = useThemeColors();
  const { customer, orders } = group;

  return (
    <AppCard>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="subheading">{customer.fullName}</AppText>
          <AppText color="muted" variant="body">
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
      {orders.length > 1 ? (
        <AppBadge label={t("openOrders.multipleOrdersBadge", { count: orders.length })} tone="primary" />
      ) : null}
      {orders.map((order, index) => (
        <View
          key={order.id}
          style={[styles.orderBlock, index > 0 ? [styles.orderBlockDivider, { borderTopColor: colors.border }] : null]}
        >
          <AppText color="secondary" variant="label">
            {t("openOrders.orderDateLabel", { date: formatDate(order.orderedAt) })}
          </AppText>
          <View style={styles.items}>
            {order.items.map((item) => (
              <AppText color="muted" key={item.id} variant="body">
                {item.productNameSnapshot}: {item.quantity} {item.unit}
              </AppText>
            ))}
          </View>
          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <AppButton label={t("openOrders.completeButton")} onPress={() => onComplete(order.id)} size="compact" />
            </View>
            <View style={styles.actionButton}>
              <AppButton
                label={t("openOrders.deleteButton")}
                onPress={() => onDelete(order.id)}
                size="compact"
                variant="danger"
              />
            </View>
          </View>
        </View>
      ))}
    </AppCard>
  );
}

const styles = StyleSheet.create({
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
  navigateButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  orderBlock: {
    gap: spacing.xs,
  },
  orderBlockDivider: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  items: {
    gap: 2,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
  },
});
