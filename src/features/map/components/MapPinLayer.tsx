import { MapPin } from "@/src/features/map/services/mapPinService";

type MapPinLayerProps = {
  id: string;
  pins: MapPin[];
  onPress: (customerId: string) => void;
};

// Android only (see MapPinLayer.android.tsx). iOS keeps its react-native-maps
// <Marker> pins (CustomerMarker / RouteStopMarker), which stay smooth there.
export function MapPinLayer(_props: MapPinLayerProps) {
  return null;
}
