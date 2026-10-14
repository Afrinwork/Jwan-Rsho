import { useRouter } from "expo-router";
import { useEffect } from "react";

import { activeTripStorage } from "@/src/features/route/services/activeTripStorage";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";

// Once per app start: if a trip was still running when the app was closed
// (or killed by the OS in the background), go straight back into it.
let checkedThisLaunch = false;

export function useResumeActiveTrip() {
  const router = useRouter();
  const userId = useCurrentUser()?.uid ?? null;

  useEffect(() => {
    if (!userId || checkedThisLaunch) return;
    checkedThisLaunch = true;

    void activeTripStorage.load(userId).then((trip) => {
      if (!trip) return;
      router.push({
        pathname: "/map/route/live",
        params: {
          ids: trip.orderedIds.join(","),
          resume: "1",
          ...(trip.departureTime ? { departureTime: trip.departureTime } : {}),
          ...(trip.originLat !== undefined && trip.originLng !== undefined
            ? { originLat: String(trip.originLat), originLng: String(trip.originLng) }
            : {}),
        },
      });
    });
  }, [router, userId]);
}
