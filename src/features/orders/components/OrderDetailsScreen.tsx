import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { colors } from "@/src/constants/colors";
import { spacing } from "@/src/constants/spacing";
import { orderDetailsRepository } from "@/src/repositories/orderDetailsRepository";
import { OrderWithItems } from "@/src/types/order";
import { formatError } from "@/src/utils/formatError";

type OrderDetailsScreenProps = {
  orderId: string;
};

export function OrderDetailsScreen({ orderId }: OrderDetailsScreenProps) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("Keine Bestellung ausgewaehlt.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    orderDetailsRepository.getOrderByIdWithItems(orderId)
      .then(setOrder)
      .catch((value) => setError(formatError(value).message))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <LoadingView label="Bestellung wird geladen..." />;

  return (
    <ScreenContainer>
      {error ? <ErrorState message={error} /> : null}
      {!order ? <EmptyState title="Keine Bestellung" message="Zu dieser Bestellung konnten keine Daten geladen werden." /> : null}
      {order ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Bestellung</Text>
          <View style={styles.card}>
            <Text style={styles.meta}>Status: {order.status === "open" ? "Offen" : order.status === "completed" ? "Erledigt" : "Storniert"}</Text>
            <Text style={styles.meta}>Datum: {new Date(order.orderedAt).toLocaleDateString()}</Text>
            <Text style={styles.meta}>Kunde-ID: {order.customerId}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.section}>Produkte</Text>
            {order.items.length ? order.items.map((item) => (
              <Text key={item.id} style={styles.meta}>{item.productNameSnapshot}: {item.quantity} {item.unit}</Text>
            )) : <Text style={styles.meta}>Keine Produkte gespeichert.</Text>}
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
