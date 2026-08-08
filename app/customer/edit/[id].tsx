import { useLocalSearchParams } from "expo-router";

import { CustomerEditScreen } from "@/src/features/customers/components/CustomerEditScreen";

export default function CustomerEditRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id;

  return <CustomerEditScreen customerId={customerId ?? ""} />;
}
