import { useEffect, useState } from "react";

import { driverLiveLocationRepository } from "@/src/repositories/driverLiveLocationRepository";
import { DriverLiveLocation } from "@/src/types/driverLiveLocation";

// Live view of where one of the admin's drivers was last seen (see
// driverLiveLocationRepository). null while nothing was reported yet.
export function useDriverLiveLocation(driverId: string) {
  const [location, setLocation] = useState<DriverLiveLocation | null>(null);

  useEffect(() => {
    if (!driverId) return;
    try {
      return driverLiveLocationRepository.subscribe(driverId, setLocation, () => undefined);
    } catch {
      // No backend configured — the screen falls back to the status report.
      return undefined;
    }
  }, [driverId]);

  return location;
}
