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
  // No street on file (city-only address) — shown as an orange pin instead
  // of the usual teal, so an imprecise location stands out on the map.
  // Optional (defaults to true / teal) so the many marker fixtures in tests
  // unrelated to this — clustering, filtering, selection — don't all need it.
  hasStreetAddress?: boolean;
};

export type MapMarkerCoordinate = {
  latitude: number;
  longitude: number;
};

// A customer with an open order that couldn't be placed on the map (no valid
// coordinates) — the other half of MapCustomerMarker's population, so an
// open order is always visible SOMEWHERE, never silently dropped.
export type CustomerNeedingAddressCheck = {
  id: string;
  fullName: string;
  address: string;
  phone: string;
  openOrderCount: number;
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
};

export type MapNavigationApp = {
  id: NavigationAppId;
  label: string;
  available: boolean;
};
