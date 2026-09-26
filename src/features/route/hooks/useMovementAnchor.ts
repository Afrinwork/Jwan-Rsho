import { useState } from "react";

import { distanceKm } from "@/src/features/map/utils/circleMath";

type Coordinate = { latitude: number; longitude: number };

// The live GPS position, but only updated once the device has moved at
// least `minMeters` since the last update — plus the moment it was taken.
// Remaining km/duration/ETA are recalculated from this (a Directions
// request per change), so a jittery fix every few meters must not trigger
// a new request each time.
export function useMovementAnchor(coordinate: Coordinate | null, minMeters: number) {
  const [anchor, setAnchor] = useState<{ coordinate: Coordinate; at: Date } | null>(null);

  // Adjusted during render (React's pattern for deriving state from a
  // changing prop) — settles immediately, since the new anchor is by
  // definition within minMeters of the current coordinate.
  if (coordinate && (!anchor || distanceKm(anchor.coordinate, coordinate) * 1000 >= minMeters)) {
    setAnchor({ coordinate, at: new Date() });
  }

  return anchor;
}
