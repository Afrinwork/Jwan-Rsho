import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

import { RouteLiveScreen } from "@/src/features/route/components/RouteLiveScreen";

export default function MapRouteLiveRoute() {
  const params = useLocalSearchParams<{ ids: string; originLat?: string; originLng?: string; departureTime?: string }>();
  const orderedIds = useMemo(() => (params.ids ?? "").split(",").filter(Boolean), [params.ids]);
  const initialOrigin = useMemo(() => {
    const latitude = Number(params.originLat);
    const longitude = Number(params.originLng);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
  }, [params.originLat, params.originLng]);
  // The departure time chosen on the list screen — arrival estimates here
  // must match what was already shown there, not silently switch to "now".
  const initialDepartureTime = useMemo(() => {
    if (!params.departureTime) return null;
    const parsed = new Date(params.departureTime);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }, [params.departureTime]);

  return <RouteLiveScreen initialDepartureTime={initialDepartureTime} initialOrigin={initialOrigin} orderedIds={orderedIds} />;
}
