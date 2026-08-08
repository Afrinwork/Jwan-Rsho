import { useLocalSearchParams } from "expo-router";

import { CityCustomerListScreen } from "@/src/features/cities/components/CityCustomerListScreen";

export default function CityDetailsRoute() {
  const params = useLocalSearchParams<{ city: string }>();
  return <CityCustomerListScreen normalizedCity={params.city ?? ""} />;
}
