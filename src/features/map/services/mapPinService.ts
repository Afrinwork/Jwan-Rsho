import { colors } from "@/src/constants/colors";
import { PIN_GREEN, PIN_SELECTED_BLACK, PIN_YELLOW } from "@/src/features/map/constants/pinColors";
import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";
import { resolveRouteStopMarkerStyle } from "@/src/features/route/services/routeStopMarkerStyleService";

// One pin as drawn by MapPinLayer (Android): plain data instead of a native
// view per customer, so the map draws every pin in one layer. Same colors
// and states as CustomerMarker / RouteStopMarker on iOS.
export type MapPin = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  color: string;
  borderColor: string;
  opacity: number;
  scale: number;
  // Higher is drawn on top.
  layer: number;
};

export function routeStopPin(
  marker: MapCustomerMarker,
  label: string,
  state: { active: boolean; inactive?: boolean; skipped?: boolean; selected?: boolean },
): MapPin {
  const style = resolveRouteStopMarkerStyle({ ...state, hasStreetAddress: marker.hasStreetAddress });
  return {
    id: marker.id,
    latitude: marker.latitude,
    longitude: marker.longitude,
    label,
    color: state.selected ? PIN_SELECTED_BLACK : style.backgroundColor,
    borderColor: state.selected ? colors.surface : style.borderColor,
    opacity: style.opacity,
    scale: style.scale,
    layer: state.active ? 3 : state.selected ? 2 : state.inactive && !state.skipped ? 0 : 1,
  };
}

export function customerPin(marker: MapCustomerMarker, selected: boolean): MapPin {
  return {
    id: marker.id,
    latitude: marker.latitude,
    longitude: marker.longitude,
    label: marker.numberLabel,
    color: selected ? PIN_SELECTED_BLACK : marker.hasStreetAddress === false ? PIN_YELLOW : PIN_GREEN,
    borderColor: colors.surface,
    opacity: 1,
    scale: selected ? 1.15 : 1,
    layer: selected ? 2 : 1,
  };
}

// Features in drawing order (later = on top) — ordering the data is enough,
// no sort-key support needed from the native renderer.
export function buildPinFeatureCollection(pins: MapPin[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const ordered = [...pins].sort((left, right) => left.layer - right.layer);
  return {
    type: "FeatureCollection",
    features: ordered.map((pin) => ({
      type: "Feature",
      id: pin.id,
      geometry: { type: "Point", coordinates: [pin.longitude, pin.latitude] },
      properties: {
        id: pin.id,
        label: pin.label,
        color: pin.color,
        borderColor: pin.borderColor,
        opacity: pin.opacity,
        scale: pin.scale,
      },
    })),
  };
}
