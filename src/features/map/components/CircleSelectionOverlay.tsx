import { Circle, Marker } from "react-native-maps";

import { colors } from "@/src/constants/colors";
import { MapCircleSelection, MapSelectionPoint } from "@/src/features/map/types/mapSelectionTypes";

type CircleSelectionOverlayProps = {
  draftCenter: MapSelectionPoint | null;
  confirmedCircle: MapCircleSelection | null;
};

export function CircleSelectionOverlay({ draftCenter, confirmedCircle }: CircleSelectionOverlayProps) {
  return (
    <>
      {draftCenter ? (
        <Marker coordinate={draftCenter} pinColor={colors.primary} title="Mittelpunkt gesetzt" />
      ) : null}
      {confirmedCircle ? (
        <Circle
          center={confirmedCircle}
          fillColor="rgba(15, 118, 110, 0.15)"
          radius={confirmedCircle.radiusKm * 1000}
          strokeColor={colors.primary}
          strokeWidth={2}
        />
      ) : null}
    </>
  );
}
