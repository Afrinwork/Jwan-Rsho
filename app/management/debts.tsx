import { useLocalSearchParams } from "expo-router";

import { DebtBookScreen } from "@/src/features/debts/components/DebtBookScreen";

export default function DebtBookRoute() {
  // ?customerId=… opens one customer's debts (from their debt box).
  const params = useLocalSearchParams<{ customerId?: string }>();
  return <DebtBookScreen customerId={params.customerId ?? null} />;
}
