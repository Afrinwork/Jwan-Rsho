import { MapCustomerMarker, MapMarkerClusterItem, MapRegion } from "@/src/features/map/types/mapTypes";

type BuildMapClustersInput = {
  markers: MapCustomerMarker[];
  region: MapRegion | null;
};

export const mapClusteringService = {
  buildClusterItems({ markers }: BuildMapClustersInput): MapMarkerClusterItem[] {
    // Clustering is intentionally a pass-through for now. The map already
    // renders through this adapter so we can add grid/supercluster logic later
    // without rewiring the screen or marker components again.
    return markers.map((marker) => ({
      type: "marker",
      id: marker.id,
      coordinate: {
        latitude: marker.latitude,
        longitude: marker.longitude,
      },
      marker,
    }));
  },
};
