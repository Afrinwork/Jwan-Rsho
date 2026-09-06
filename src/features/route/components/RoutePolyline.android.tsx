import { useMemo } from "react";
import { GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";

import { LatLng } from "@/src/features/map/types/mapViewTypes";

type RoutePolylineProps = {
  coordinates: LatLng[];
};

const routeStroke = "#2563EB";

// MapLibre port of RoutePolyline.tsx — same blue route line, built from a
// GeoJSON LineString source + a line-type Layer instead of react-native-maps'
// dedicated <Polyline> component.
export function RoutePolyline({ coordinates }: RoutePolylineProps) {
  const geojson = useMemo<GeoJSON.Feature<GeoJSON.LineString>>(
    () => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: coordinates.map((point) => [point.longitude, point.latitude]),
      },
    }),
    [coordinates],
  );

  return (
    <GeoJSONSource data={geojson} id="route-line-source">
      <Layer id="route-line" paint={{ "line-color": routeStroke, "line-width": 4 }} type="line" />
    </GeoJSONSource>
  );
}
