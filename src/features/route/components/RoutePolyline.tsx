import { Polyline } from "react-native-maps";

import { LatLng } from "@/src/features/map/types/mapViewTypes";

type RoutePolylineProps = {
  coordinates: LatLng[];
};

const routeStroke = "#2563EB";

// Extracted from RouteLiveScreen.tsx (was inlined there) so that screen never
// imports anything platform-specific itself — see RoutePolyline.android.tsx
// for the MapLibre counterpart.
export function RoutePolyline({ coordinates }: RoutePolylineProps) {
  return <Polyline coordinates={coordinates} strokeColor={routeStroke} strokeWidth={4} />;
}
