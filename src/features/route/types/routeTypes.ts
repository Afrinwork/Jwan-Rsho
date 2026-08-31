import { MapCustomerMarker } from "@/src/features/map/types/mapTypes";

export type RoutePoint = {
  id: string;
  latitude: number;
  longitude: number;
};

export type RouteOrigin = {
  latitude: number;
  longitude: number;
  label: string;
};

export type RouteStop = {
  marker: MapCustomerMarker;
  orderIndex: number;
  distanceFromPreviousKm: number;
  cumulativeDistanceKm: number;
  cumulativeEta: Date;
  // true while this stop only has a straight-line estimate and the real
  // driving route from the Directions API hasn't come back yet.
  isEstimated: boolean;
};

export type RouteComputationStatus = "idle" | "loading" | "ready" | "error";
