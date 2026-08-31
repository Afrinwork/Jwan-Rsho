import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

import { RouteLiveScreen } from "@/src/features/route/components/RouteLiveScreen";

export default function MapRouteLiveRoute() {
  const params = useLocalSearchParams<{ ids: string; originLat?: string; originLng?: string }>();
  const orderedIds = useMemo(() => (params.ids ?? "").split(",").filter(Boolean), [params.ids]);
  const initialOrigin = useMemo(() => {
    const latitude = Number(params.originLat);
    const longitude = Number(params.originLng);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
  }, [params.originLat, params.originLng]);

  return <RouteLiveScreen initialOrigin={initialOrigin} orderedIds={orderedIds} />;
}
