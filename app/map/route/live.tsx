import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import { LoadingView } from "@/src/components/ui/LoadingView";
import { RouteLiveScreen } from "@/src/features/route/components/RouteLiveScreen";
import { routeT } from "@/src/features/route/i18n/routeT";
import { activeTripStorage, StoredActiveTrip } from "@/src/features/route/services/activeTripStorage";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";

export default function MapRouteLiveRoute() {
  const params = useLocalSearchParams<{ ids: string; originLat?: string; originLng?: string; departureTime?: string; resume?: string }>();
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

  // Reopened after the app was closed: completed/skipped stops come back
  // from the device (activeTripStorage), the rest from the params above.
  const isResume = params.resume === "1";
  const userId = useCurrentUser()?.uid ?? null;
  const [restored, setRestored] = useState<StoredActiveTrip | null | undefined>(isResume ? undefined : null);
  useEffect(() => {
    if (!isResume) return;
    let active = true;
    void activeTripStorage.load(userId).then((trip) => {
      if (active) setRestored(trip);
    });
    return () => {
      active = false;
    };
  }, [isResume, userId]);

  if (restored === undefined) return <LoadingView label={routeT("screen.loading")} />;

  return (
    <RouteLiveScreen
      initialDepartureTime={initialDepartureTime}
      initialOrigin={initialOrigin}
      orderedIds={orderedIds}
      restoredState={restored ? { handledIds: restored.handledIds, skippedIds: restored.skippedIds } : undefined}
    />
  );
}
