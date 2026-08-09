import { Circle } from "react-native-maps";
import { MapCircleSelection, MapSelectionPoint } from "@/src/features/map/types/mapSelectionTypes";

const circleStroke = "#F97316";
const circleFill = "rgba(249, 115, 22, 0.16)";

type CircleSelectionOverlayProps = {
  draftCenter: MapSelectionPoint | null;
  confirmedCircle: MapCircleSelection | null;
};

export function CircleSelectionOverlay({ draftCenter, confirmedCircle }: CircleSelectionOverlayProps) {
  return (
    <>
      {confirmedCircle ? (
        <Circle
          center={confirmedCircle}
          fillColor={circleFill}
          radius={confirmedCircle.radiusKm * 1000}
          strokeColor={circleStroke}
          strokeWidth={4}
        />
      ) : null}
      {draftCenter ? (
        <Circle
          center={draftCenter}
          fillColor="rgba(249, 115, 22, 0.06)"
          radius={22}
          strokeColor={circleStroke}
          strokeWidth={3}
        />
      ) : null}
    </>
  );
}
