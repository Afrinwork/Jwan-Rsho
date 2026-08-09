import { Polygon, Polyline } from "react-native-maps";
import { MapSelectionPoint } from "@/src/features/map/types/mapSelectionTypes";

const polygonStroke = "#F97316";
const polygonFill = "rgba(249, 115, 22, 0.16)";

type PolygonSelectionOverlayProps = {
  draftPoints: MapSelectionPoint[];
  confirmedPolygon: MapSelectionPoint[] | null;
};

export function PolygonSelectionOverlay({ draftPoints, confirmedPolygon }: PolygonSelectionOverlayProps) {
  return (
    <>
      {draftPoints.length >= 2 ? (
        <Polyline coordinates={draftPoints} strokeColor={polygonStroke} strokeWidth={4} />
      ) : null}
      {confirmedPolygon ? (
        <Polygon
          coordinates={confirmedPolygon}
          fillColor={polygonFill}
          strokeColor={polygonStroke}
          strokeWidth={4}
        />
      ) : null}
    </>
  );
}
