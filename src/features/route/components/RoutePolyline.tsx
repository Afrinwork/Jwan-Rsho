import { Polyline } from "react-native-maps";

import { LatLng } from "@/src/features/map/types/mapViewTypes";

type RoutePolylineProps = {
  coordinates: LatLng[];
};

const routeStroke = "#2563EB";

// Extracted from RouteLiveScreen.tsx (was inlined there) so that screen never
// imports anything platform-specific itself — see RoutePolyline.android.tsx
// for the MapLibre counterpart.
//
// Apple Maps only redraws some of a long line's tiles when its coordinates
// change in place, leaving gaps along the route — a new line (key) for every
// new route makes it draw the whole line again.
export function RoutePolyline({ coordinates }: RoutePolylineProps) {
  return (
    <Polyline
      coordinates={coordinates}
      key={lineKey(coordinates)}
      strokeColor={routeStroke}
      strokeWidth={4}
    />
  );
}

function lineKey(coordinates: LatLng[]) {
  const first = coordinates[0];
  const last = coordinates.at(-1);
  return `${coordinates.length}:${first?.latitude},${first?.longitude}:${last?.latitude},${last?.longitude}`;
}
