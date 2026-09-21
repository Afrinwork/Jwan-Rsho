import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { colors } from "@/src/constants/colors";
import { spacing } from "@/src/constants/spacing";
import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { OrderWithItems } from "@/src/types/order";
import { formatDate } from "@/src/utils/date";
import { formatError } from "@/src/utils/formatError";

type OrderDetailsScreenProps = {
  orderId: string;
};

export function OrderDetailsScreen({ orderId }: OrderDetailsScreenProps) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation("orders");

  // Genuine fetch-on-dependency-change effect (React's own documented
  // data-fetching pattern) — the state resets below are the correct,
  // synchronous first step for each branch, not state that could be
  // computed during render instead (the fetch itself must stay in an
  // effect).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!orderId) {
      setError(t("details.noOrderSelected"));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    orderDetailsRepository.getOrderByIdWithItems(orderId)
      .then(setOrder)
      .catch((value) => setError(formatError(value).message))
      .finally(() => setLoading(false));
  }, [orderId, t]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (loading) return <LoadingView label={t("details.loading")} />;

  const statusLabel =
    order?.status === "open"
      ? t("details.status.open")
      : order?.status === "completed"
        ? t("details.status.completed")
        : t("details.status.cancelled");

  return (
    <ScreenContainer>
      {error ? <ErrorState message={error} /> : null}
      {!order ? <EmptyState title={t("details.emptyTitle")} message={t("details.emptyMessage")} /> : null}
      {order ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t("navigation:stack.order")}</Text>
          <View style={styles.card}>
            <Text style={styles.meta}>{t("details.statusLabel")} {statusLabel}</Text>
            <Text style={styles.meta}>{t("details.dateLabel")} {formatDate(order.orderedAt)}</Text>
            <Text style={styles.meta}>{t("details.customerIdLabel")} {order.customerId}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.section}>{t("items.sectionTitle")}</Text>
            {order.items.length ? order.items.map((item) => (
              <Text key={item.id} style={styles.meta}>{item.productNameSnapshot}: {item.quantity} {item.unit}</Text>
            )) : <Text style={styles.meta}>{t("details.noProducts")}</Text>}
          </View>
        </ScrollView>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  title: { color: colors.text, fontSize: 24, fontWeight: "700" },
  card: { backgroundColor: colors.surface, borderRadius: 14, gap: 8, padding: spacing.md },
  section: { color: colors.text, fontSize: 16, fontWeight: "700" },
  meta: { color: colors.mutedText, fontSize: 14 },
});
