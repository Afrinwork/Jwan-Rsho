import { useLocalSearchParams } from "expo-router";

import { CustomerDetailsScreen } from "@/src/features/customers/components/CustomerDetailsScreen";

export default function CustomerRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  return <CustomerDetailsScreen customerId={params.id ?? ""} />;
}
