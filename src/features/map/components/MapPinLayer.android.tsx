import { memo, useMemo } from "react";
import { GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";

import { buildPinFeatureCollection, MapPin } from "@/src/features/map/services/mapPinService";

type MapPinLayerProps = {
  // Unique per map screen, prefixes the native source/layer ids.
  id: string;
  pins: MapPin[];
  onPress: (customerId: string) => void;
};

const PIN_RADIUS = 15;

// Every customer/stop pin in one GeoJSON source drawn by MapLibre itself —
// instead of one native <Marker> view per customer, which on Android made
// the map hang (and the app get killed) on weaker phones once a few dozen
// pins were on it. Updating the pins is a single setData, and GPS updates
// that don't change any pin cost nothing.
function MapPinLayerComponent({ id, pins, onPress }: MapPinLayerProps) {
  const data = useMemo(() => buildPinFeatureCollection(pins), [pins]);

  return (
    <GeoJSONSource
      data={data}
      id={`${id}-pins`}
      onPress={(event) => {
        // The top-most pin under the finger is the last one drawn.
        const features = event.nativeEvent.features;
        const customerId = features[features.length - 1]?.properties?.id;
        if (typeof customerId === "string") onPress(customerId);
      }}
    >
      <Layer
        id={`${id}-pin-circles`}
        paint={{
          "circle-radius": ["*", PIN_RADIUS, ["get", "scale"]],
          "circle-color": ["get", "color"],
          "circle-opacity": ["get", "opacity"],
          "circle-stroke-color": ["get", "borderColor"],
          "circle-stroke-width": 2,
          "circle-stroke-opacity": ["get", "opacity"],
        }}
        type="circle"
      />
      <Layer
        id={`${id}-pin-labels`}
        layout={{
          "text-field": ["get", "label"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 13,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        }}
        paint={{ "text-color": "#FFFFFF", "text-opacity": ["get", "opacity"] }}
        type="symbol"
      />
    </GeoJSONSource>
  );
}

export const MapPinLayer = memo(MapPinLayerComponent);
