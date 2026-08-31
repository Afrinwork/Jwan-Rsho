import { distanceKm } from "@/src/features/map/utils/circleMath";
import { RouteOrigin, RoutePoint } from "@/src/features/route/types/routeTypes";

// Google Directions API allows at most 25 locations per request (origin +
// destination + up to 23 waypoints). Above that we have to split into chunks.
const MAX_WAYPOINTS_PER_REQUEST = 23;
const DIRECTIONS_ENDPOINT = "https://maps.googleapis.com/maps/api/directions/json";

export class RouteDirectionsError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export type RouteLeg = {
  point: RoutePoint;
  distanceKm: number;
  durationSec: number;
};

// Used only for the immediate, pre-network preview of the list — a rough
// guess so the screen isn't empty while the real Directions request is in
// flight. 70 km/h approximates a realistic German city/highway driving mix —
// 30 km/h (pure city-traffic speed) made routes look ~2-4x slower than they
// actually are once the real road route comes back.
const FALLBACK_AVERAGE_SPEED_KMH = 70;

export function buildFallbackLegs(origin: RouteOrigin, orderedPoints: RoutePoint[]): RouteLeg[] {
  let current: { latitude: number; longitude: number } = origin;

  return orderedPoints.map((point) => {
    const distance = distanceKm(current, point);
    current = point;

    return {
      point,
      distanceKm: distance,
      durationSec: (distance / FALLBACK_AVERAGE_SPEED_KMH) * 3600,
    };
  });
}

export function nearestNeighborOrder(origin: RouteOrigin, points: RoutePoint[]): RoutePoint[] {
  const remaining = [...points];
  const ordered: RoutePoint[] = [];
  let current: { latitude: number; longitude: number } = origin;

  while (remaining.length) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    remaining.forEach((point, index) => {
      const distance = distanceKm(current, point);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const [next] = remaining.splice(nearestIndex, 1);
    ordered.push(next);
    current = next;
  }

  return ordered;
}

export function buildCumulativeStops(legs: RouteLeg[], departureDate: Date) {
  let cumulativeDistanceKm = 0;
  let cumulativeEta = new Date(departureDate);

  return legs.map((leg, index) => {
    cumulativeDistanceKm += leg.distanceKm;
    cumulativeEta = new Date(cumulativeEta.getTime() + leg.durationSec * 1000);

    return {
      id: leg.point.id,
      orderIndex: index,
      distanceFromPreviousKm: leg.distanceKm,
      cumulativeDistanceKm,
      cumulativeEta,
    };
  });
}

function chunkPoints<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function toLatLng(point: { latitude: number; longitude: number }) {
  return `${point.latitude},${point.longitude}`;
}

// Google only accepts a departure_time at or after "now" for traffic-aware
// driving estimates — a manually chosen time earlier today would otherwise
// make the request fail, so we clamp it up to the current moment.
function toDepartureTimeParam(departureDate: Date) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const requestedSeconds = Math.floor(departureDate.getTime() / 1000);
  return Math.max(nowSeconds, requestedSeconds);
}

function buildDirectionsUrl(origin: RouteOrigin, stops: RoutePoint[], departureDate: Date, apiKey: string) {
  const params = new URLSearchParams({
    origin: toLatLng(origin),
    mode: "driving",
    departure_time: String(toDepartureTimeParam(departureDate)),
    key: apiKey,
  });

  if (stops.length === 1) {
    params.set("destination", toLatLng(stops[0]));
  } else {
    params.set("destination", toLatLng(origin));
    params.set("waypoints", `optimize:true|${stops.map(toLatLng).join("|")}`);
  }

  return `${DIRECTIONS_ENDPOINT}?${params.toString()}`;
}

export type DirectionsApiResponse = {
  status: string;
  error_message?: string;
  routes: {
    waypoint_order: number[];
    overview_polyline?: { points: string };
    legs: {
      distance: { value: number };
      duration: { value: number };
      duration_in_traffic?: { value: number };
    }[];
  }[];
};

export type RouteLatLng = { latitude: number; longitude: number };

// Standard Google encoded-polyline algorithm (used by overview_polyline.points).
// https://developers.google.com/maps/documentation/utilities/polylinealgorithm
export function decodePolyline(encoded: string): RouteLatLng[] {
  const coordinates: RouteLatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return coordinates;
}

export function extractOverviewPolyline(response: DirectionsApiResponse): string | null {
  return response.routes[0]?.overview_polyline?.points ?? null;
}

// For requests where the stop order was already fixed by the caller (no
// optimize:true, e.g. the live-map polyline/leg fetch) — legs come back in
// the exact order requested, so no waypoint_order lookup is needed.
export function parseLegsInRequestOrder(response: DirectionsApiResponse, orderedPoints: RoutePoint[]): RouteLeg[] {
  if (response.status !== "OK") {
    throw new RouteDirectionsError(response.error_message ?? response.status, response.status);
  }

  const [route] = response.routes;
  if (!route) {
    throw new RouteDirectionsError("No route returned.", "ZERO_RESULTS");
  }

  return orderedPoints.map((point, index) => {
    const leg = route.legs[index];
    return {
      point,
      distanceKm: leg.distance.value / 1000,
      durationSec: leg.duration_in_traffic?.value ?? leg.duration.value,
    };
  });
}

export function parseDirectionsResponse(response: DirectionsApiResponse, stops: RoutePoint[]): RouteLeg[] {
  if (response.status !== "OK") {
    throw new RouteDirectionsError(response.error_message ?? response.status, response.status);
  }

  const [route] = response.routes;
  if (!route) {
    throw new RouteDirectionsError("No route returned.", "ZERO_RESULTS");
  }

  if (stops.length === 1) {
    const [leg] = route.legs;
    return [
      {
        point: stops[0],
        distanceKm: leg.distance.value / 1000,
        durationSec: leg.duration_in_traffic?.value ?? leg.duration.value,
      },
    ];
  }

  const orderedStops = route.waypoint_order.map((stopIndex) => stops[stopIndex]);

  // legs.length === stops.length + 1: one leg per waypoint reached, plus a
  // trailing leg back to the origin (round trip) that we don't need.
  return orderedStops.map((point, index) => {
    const leg = route.legs[index];
    return {
      point,
      distanceKm: leg.distance.value / 1000,
      durationSec: leg.duration_in_traffic?.value ?? leg.duration.value,
    };
  });
}

async function fetchLegsForChunk(origin: RouteOrigin, stops: RoutePoint[], departureDate: Date, apiKey: string) {
  const url = buildDirectionsUrl(origin, stops, departureDate, apiKey);
  const response = await fetch(url);

  if (!response.ok) {
    throw new RouteDirectionsError(`Directions request failed (${response.status}).`, "REQUEST_FAILED");
  }

  const body = (await response.json()) as DirectionsApiResponse;
  return parseDirectionsResponse(body, stops);
}

// >23 stops: pre-sort with straight-line nearest-neighbor first, then fetch
// real driving legs in chunks of MAX_WAYPOINTS_PER_REQUEST. Each chunk is
// optimized on its own, so the order is not globally optimal above the limit.
export async function computeRouteLegs(
  origin: RouteOrigin,
  stops: RoutePoint[],
  departureDate: Date,
  apiKey: string,
): Promise<RouteLeg[]> {
  if (!stops.length) {
    return [];
  }

  if (!apiKey) {
    throw new RouteDirectionsError("Missing Google Directions API key.", "MISSING_API_KEY");
  }

  if (stops.length <= MAX_WAYPOINTS_PER_REQUEST) {
    return fetchLegsForChunk(origin, stops, departureDate, apiKey);
  }

  const preOrdered = nearestNeighborOrder(origin, stops);
  const chunks = chunkPoints(preOrdered, MAX_WAYPOINTS_PER_REQUEST);
  const legs: RouteLeg[] = [];
  let chunkOrigin: RouteOrigin = origin;
  let chunkDepartureDate = departureDate;

  for (const stopsChunk of chunks) {
    const chunkLegs = await fetchLegsForChunk(chunkOrigin, stopsChunk, chunkDepartureDate, apiKey);
    legs.push(...chunkLegs);

    const lastLeg = chunkLegs.at(-1)!;
    chunkOrigin = { ...lastLeg.point, label: "" };
    const elapsedSec = chunkLegs.reduce((sum, leg) => sum + leg.durationSec, 0);
    chunkDepartureDate = new Date(chunkDepartureDate.getTime() + elapsedSec * 1000);
  }

  return legs;
}

// For the live map: origin -> stops in the ALREADY decided order (no
// optimize:true — the order was fixed on the list screen), returning the
// road-following polyline for display only (no leg timing needed here).
function buildPolylineUrl(origin: RouteLatLng, orderedPoints: RoutePoint[], apiKey: string) {
  const params = new URLSearchParams({
    origin: toLatLng(origin),
    destination: toLatLng(orderedPoints.at(-1)!),
    mode: "driving",
    key: apiKey,
  });

  const waypoints = orderedPoints.slice(0, -1);
  if (waypoints.length) {
    params.set("waypoints", waypoints.map(toLatLng).join("|"));
  }

  return `${DIRECTIONS_ENDPOINT}?${params.toString()}`;
}

export type RoutePolylineResult = {
  coordinates: RouteLatLng[];
  legs: RouteLeg[];
};

async function fetchPolylineChunk(origin: RouteLatLng, orderedPoints: RoutePoint[], apiKey: string): Promise<RoutePolylineResult> {
  const response = await fetch(buildPolylineUrl(origin, orderedPoints, apiKey));

  if (!response.ok) {
    throw new RouteDirectionsError(`Directions request failed (${response.status}).`, "REQUEST_FAILED");
  }

  const body = (await response.json()) as DirectionsApiResponse;
  const legs = parseLegsInRequestOrder(body, orderedPoints);
  const encoded = extractOverviewPolyline(body);

  return { coordinates: encoded ? decodePolyline(encoded) : [], legs };
}

// Distance/duration to the very next stop come from `legs[0]` of the result
// — legs are in the same order as orderedPoints, so the first leg always
// covers origin -> the current target.
export async function fetchRoutePolyline(origin: RouteLatLng, orderedPoints: RoutePoint[], apiKey: string): Promise<RoutePolylineResult> {
  if (!orderedPoints.length) {
    return { coordinates: [], legs: [] };
  }

  if (!apiKey) {
    throw new RouteDirectionsError("Missing Google Directions API key.", "MISSING_API_KEY");
  }

  const chunks = chunkPoints(orderedPoints, MAX_WAYPOINTS_PER_REQUEST);
  const coordinates: RouteLatLng[] = [];
  const legs: RouteLeg[] = [];
  let chunkOrigin = origin;

  for (const chunk of chunks) {
    const chunkResult = await fetchPolylineChunk(chunkOrigin, chunk, apiKey);
    coordinates.push(...chunkResult.coordinates);
    legs.push(...chunkResult.legs);
    chunkOrigin = chunk.at(-1)!;
  }

  return { coordinates, legs };
}
