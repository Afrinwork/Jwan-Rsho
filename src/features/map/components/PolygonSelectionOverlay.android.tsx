import { useMemo } from "react";
import { GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";

import { MapSelectionPoint } from "@/src/features/map/types/mapSelectionTypes";

const polygonStroke = "#F97316";
const polygonFill = "rgba(249, 115, 22, 0.16)";

type PolygonSelectionOverlayProps = {
  draftPoints: MapSelectionPoint[];
  confirmedPolygon: MapSelectionPoint[] | null;
};

// MapLibre port of PolygonSelectionOverlay.tsx — same orange draft outline +
// filled confirmed shape, built from GeoJSON sources/layers instead of
// react-native-maps' dedicated <Polyline>/<Polygon> components.
export function PolygonSelectionOverlay({ draftPoints, confirmedPolygon }: PolygonSelectionOverlayProps) {
  const draftLine = useMemo<GeoJSON.Feature<GeoJSON.LineString> | null>(() => {
    if (draftPoints.length < 2) return null;
    return {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: draftPoints.map((point) => [point.longitude, point.latitude]) },
    };
  }, [draftPoints]);

  const confirmedShape = useMemo<GeoJSON.Feature<GeoJSON.Polygon> | null>(() => {
    if (!confirmedPolygon) return null;
    const ring = confirmedPolygon.map((point) => [point.longitude, point.latitude] as [number, number]);
    const first = ring[0];
    const last = ring[ring.length - 1];
    // GeoJSON polygon rings must be closed (first coordinate repeated at the
    // end) — the app's own confirmedPolygon points never include that
    // closing repeat, react-native-maps' <Polygon> didn't need it either.
    const closedRing = first[0] === last[0] && first[1] === last[1] ? ring : [...ring, first];
    return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [closedRing] } };
  }, [confirmedPolygon]);

  return (
    <>
      {draftLine ? (
        <GeoJSONSource data={draftLine} id="polygon-draft-source">
          <Layer id="polygon-draft-line" paint={{ "line-color": polygonStroke, "line-width": 4 }} type="line" />
        </GeoJSONSource>
      ) : null}
      {confirmedShape ? (
        <GeoJSONSource data={confirmedShape} id="polygon-confirmed-source">
          <Layer id="polygon-confirmed-fill" paint={{ "fill-color": polygonFill }} type="fill" />
          <Layer id="polygon-confirmed-line" paint={{ "line-color": polygonStroke, "line-width": 4 }} type="line" />
        </GeoJSONSource>
      ) : null}
    </>
  );
}
