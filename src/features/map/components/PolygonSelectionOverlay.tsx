import { Marker, Polygon, Polyline } from "react-native-maps";

import { colors } from "@/src/constants/colors";
import { MapSelectionPoint } from "@/src/features/map/types/mapSelectionTypes";

type PolygonSelectionOverlayProps = {
  draftPoints: MapSelectionPoint[];
  confirmedPolygon: MapSelectionPoint[] | null;
};

export function PolygonSelectionOverlay({ draftPoints, confirmedPolygon }: PolygonSelectionOverlayProps) {
  return (
    <>
      {draftPoints.map((point, index) => (
        <Marker coordinate={point} key={`draft-${index}`} pinColor={colors.primary} />
      ))}
      {draftPoints.length >= 2 ? (
        <Polyline coordinates={draftPoints} strokeColor={colors.primary} strokeWidth={2} />
      ) : null}
      {confirmedPolygon ? (
        <Polygon
          coordinates={confirmedPolygon}
          fillColor="rgba(15, 118, 110, 0.15)"
          strokeColor={colors.primary}
          strokeWidth={2}
        />
      ) : null}
    </>
  );
}
