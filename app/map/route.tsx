import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

import { RouteScreen } from "@/src/features/route/components/RouteScreen";

export default function MapRouteRoute() {
  const params = useLocalSearchParams<{ ids: string }>();
  const selectedIds = useMemo(() => (params.ids ?? "").split(",").filter(Boolean), [params.ids]);

  return <RouteScreen selectedIds={selectedIds} />;
}
