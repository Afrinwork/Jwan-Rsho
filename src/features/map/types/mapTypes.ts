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
  latitude: number;
  longitude: number;
  numberLabel: string;
  currentOpenOrderId: string | null;
  country: string;
  city: string;
  region: string;
};

export type MapCustomerDetails = {
  customer: Customer;
  openOrder: OrderWithItems | null;
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
