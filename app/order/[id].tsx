import { useLocalSearchParams } from "expo-router";

import { OrderDetailsScreen } from "@/src/features/orders/components/OrderDetailsScreen";

export default function OrderRoute() {
  const params = useLocalSearchParams<{ id?: string }>();

  return <OrderDetailsScreen orderId={params.id ?? ""} />;
}
