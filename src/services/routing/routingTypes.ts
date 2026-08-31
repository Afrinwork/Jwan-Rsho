export type RoutingCoordinate = { latitude: number; longitude: number };

export type RoutingLeg = {
  distanceMeters: number;
  durationSeconds: number;
  polyline: RoutingCoordinate[];
};

export type RoutingErrorCode = "MISSING_API_KEY" | "REQUEST_FAILED" | "NO_ROUTE";

export class RoutingError extends Error {
  code: RoutingErrorCode;

  constructor(message: string, code: RoutingErrorCode) {
    super(message);
    this.code = code;
  }
}
