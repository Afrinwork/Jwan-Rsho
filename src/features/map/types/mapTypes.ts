import { Customer } from "@/src/types/customer";
import { OrderWithItems } from "@/src/types/order";

export type NavigationAppId = "apple-maps" | "google-maps" | "waze";

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapCustomerMarker = {
  id: string;
  title: string;
  description: string;
  phone: string;
  note: string;
  latitude: number;
  longitude: number;
  numberLabel: string;
  openOrderCount: number;
  country: string;
  city: string;
  region: string;
};

export type MapMarkerCoordinate = {
  latitude: number;
  longitude: number;
};

export type MapMarkerClusterItem =
  | {
      type: "marker";
      id: string;
      coordinate: MapMarkerCoordinate;
      marker: MapCustomerMarker;
    }
  | {
      type: "cluster";
      id: string;
      coordinate: MapMarkerCoordinate;
      markers: MapCustomerMarker[];
      count: number;
    };

export type MapCustomerDetails = {
  customer: Customer;
  openOrders: OrderWithItems[];
};

export type MapFilterState = {
  country: string;
  city: string;
  region: string;
};

export type MapNavigationApp = {
  id: NavigationAppId;
  label: string;
  available: boolean;
};
