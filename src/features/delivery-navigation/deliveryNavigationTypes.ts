import { RoutingCoordinate, RoutingLeg } from "@/src/services/routing/routingTypes";

export type DeliveryStopStatus = "pending" | "active" | "completed" | "skipped";

export type DeliveryStop = {
  customerId: string;
  orderId?: string;
  name: string;
  latitude: number;
  longitude: number;
  status: DeliveryStopStatus;
  // Free-text country name as stored on the customer (see Customer.country) —
  // resolved to an IANA timezone for ETA display via getTimeZoneForCountry,
  // matched against the owner's managed Country list. Not part of the exact
  // spec shape but kept here (not on a separate lookup) since a stop's
  // country never changes once loaded.
  country?: string;
};

export type DeliveryNavigationState = {
  isNavigating: boolean;
  stops: DeliveryStop[];
  currentStopIndex: number;
  currentLocation: RoutingCoordinate | null;
  activeRoute: RoutingLeg | null;
  remainingRouteDistanceMeters: number | null;
  remainingRouteDurationSeconds: number | null;
  estimatedArrival: Date | null;
  isRouteLoading: boolean;
  error: string | null;
};

export const initialDeliveryNavigationState: DeliveryNavigationState = {
  isNavigating: false,
  stops: [],
  currentStopIndex: -1,
  currentLocation: null,
  activeRoute: null,
  remainingRouteDistanceMeters: null,
  remainingRouteDurationSeconds: null,
  estimatedArrival: null,
  isRouteLoading: false,
  error: null,
};
