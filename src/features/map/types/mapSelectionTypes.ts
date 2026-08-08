export type MapSelectionTool = "none" | "single" | "circle" | "polygon";

export type MapSelectionPoint = {
  latitude: number;
  longitude: number;
};

export type MapCircleSelection = MapSelectionPoint & {
  radiusKm: number;
};
