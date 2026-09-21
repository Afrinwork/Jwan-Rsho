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

// Used for any straight-line preview (the list screen before the real
// Directions request lands, and the live screen whenever there's no API key
// or a request fails). Fixed value, chosen manually (not derived/measured) —
// adjust this single constant if it stops matching real routes well.
export const FALLBACK_AVERAGE_SPEED_KMH = 90;

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

// lastStopId, if given and present in points, is excluded from the greedy
// walk and appended at the very end instead — so the walk among the rest
// isn't distorted by detouring toward/away from a stop that's pinned last.
export function nearestNeighborOrder(origin: RouteOrigin, points: RoutePoint[], lastStopId?: string): RoutePoint[] {
  const pinnedLast = lastStopId ? points.find((point) => point.id === lastStopId) : undefined;
  const remaining = pinnedLast ? points.filter((point) => point.id !== lastStopId) : [...points];
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

  if (pinnedLast) {
    ordered.push(pinnedLast);
  }

  return ordered;
}

// Time spent actually handing over an order at a stop (parking, unloading,
// a signature, ...) — driving duration alone understated every stop after
// the first, showing arrival times that assumed the driver teleports away
// the instant they arrive. Applied between stops, never before the first
// one (there's no prior stop to have spent time at yet).
export const STOP_SERVICE_BUFFER_SEC = 10 * 60;

export function buildCumulativeStops(legs: RouteLeg[], departureDate: Date) {
  let cumulativeDistanceKm = 0;
  let cumulativeEta = new Date(departureDate);

  return legs.map((leg, index) => {
    // A single malformed leg (e.g. a degenerate distance calculation) must
    // not turn every following stop's ETA into an Invalid Date -- treat a
    // non-finite distance/duration as "unknown" (0) instead of letting NaN
    // propagate through the running cumulative total for the rest of the list.
    const legDistanceKm = Number.isFinite(leg.distanceKm) ? leg.distanceKm : 0;
    const legDurationSec = Number.isFinite(leg.durationSec) ? leg.durationSec : 0;

    cumulativeDistanceKm += legDistanceKm;
    const serviceBufferSec = index > 0 ? STOP_SERVICE_BUFFER_SEC : 0;
    cumulativeEta = new Date(cumulativeEta.getTime() + (serviceBufferSec + legDurationSec) * 1000);

    return {
      id: leg.point.id,
      orderIndex: index,
      distanceFromPreviousKm: legDistanceKm,
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

// When lastStopId is set, the request stops being a round trip back to
// origin: the pinned stop becomes the actual destination, and every other
// selected stop is still freely optimized as a waypoint in between.
function buildDirectionsUrl(origin: RouteOrigin, stops: RoutePoint[], departureDate: Date, apiKey: string, lastStopId?: string) {
  const params = new URLSearchParams({
    origin: toLatLng(origin),
    mode: "driving",
    departure_time: String(toDepartureTimeParam(departureDate)),
    key: apiKey,
  });

  const pinnedLast = lastStopId ? stops.find((stop) => stop.id === lastStopId) : undefined;
  const optimizable = pinnedLast ? stops.filter((stop) => stop.id !== lastStopId) : stops;

  if (pinnedLast) {
    params.set("destination", toLatLng(pinnedLast));
    if (optimizable.length) {
      params.set("waypoints", `optimize:true|${optimizable.map(toLatLng).join("|")}`);
    }
  } else if (stops.length === 1) {
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

export function parseDirectionsResponse(response: DirectionsApiResponse, stops: RoutePoint[], lastStopId?: string): RouteLeg[] {
  if (response.status !== "OK") {
    throw new RouteDirectionsError(response.error_message ?? response.status, response.status);
  }

  const [route] = response.routes;
  if (!route) {
    throw new RouteDirectionsError("No route returned.", "ZERO_RESULTS");
  }

  const pinnedLast = lastStopId ? stops.find((stop) => stop.id === lastStopId) : undefined;
  const optimizable = pinnedLast ? stops.filter((stop) => stop.id !== lastStopId) : stops;

  if (pinnedLast && optimizable.length === 0) {
    const [leg] = route.legs;
    return [
      {
        point: pinnedLast,
        distanceKm: leg.distance.value / 1000,
        durationSec: leg.duration_in_traffic?.value ?? leg.duration.value,
      },
    ];
  }

  if (!pinnedLast && stops.length === 1) {
    const [leg] = route.legs;
    return [
      {
        point: stops[0],
        distanceKm: leg.distance.value / 1000,
        durationSec: leg.duration_in_traffic?.value ?? leg.duration.value,
      },
    ];
  }

  // waypoint_order only ever indexes the optimized waypoints — with a pinned
  // last stop, that's `optimizable` (destination isn't a waypoint); without
  // one, it's the whole stop list (destination = origin, a round trip).
  const orderedWaypoints = route.waypoint_order.map((stopIndex) => optimizable[stopIndex]);
  const orderedStops = pinnedLast ? [...orderedWaypoints, pinnedLast] : orderedWaypoints;

  // legs.length is orderedStops.length exactly when there's a pinned
  // destination (one leg per waypoint plus one to the destination). Without
  // one it's stops.length + 1 (an extra trailing leg back to origin for the
  // round trip) — mapping only `orderedStops.length` entries already ignores
  // that trailing leg.
  return orderedStops.map((point, index) => {
    const leg = route.legs[index];
    return {
      point,
      distanceKm: leg.distance.value / 1000,
      durationSec: leg.duration_in_traffic?.value ?? leg.duration.value,
    };
  });
}

async function fetchLegsForChunk(origin: RouteOrigin, stops: RoutePoint[], departureDate: Date, apiKey: string, lastStopId?: string) {
  const url = buildDirectionsUrl(origin, stops, departureDate, apiKey, lastStopId);
  const response = await fetch(url);

  if (!response.ok) {
    throw new RouteDirectionsError(`Directions request failed (${response.status}).`, "REQUEST_FAILED");
  }

  const body = (await response.json()) as DirectionsApiResponse;
  return parseDirectionsResponse(body, stops, lastStopId);
}

// >23 stops: pre-sort with straight-line nearest-neighbor first, then fetch
// real driving legs in chunks of MAX_WAYPOINTS_PER_REQUEST. Each chunk is
// optimized on its own, so the order is not globally optimal above the limit.
// lastStopId, if set, is honored end-to-end: nearestNeighborOrder already
// guarantees it lands in the final chunk, and only that chunk's request is
// told to end there instead of looping back to that chunk's own origin.
export async function computeRouteLegs(
  origin: RouteOrigin,
  stops: RoutePoint[],
  departureDate: Date,
  apiKey: string,
  lastStopId?: string,
): Promise<RouteLeg[]> {
  if (!stops.length) {
    return [];
  }

  if (!apiKey) {
    throw new RouteDirectionsError("Missing Google Directions API key.", "MISSING_API_KEY");
  }

  if (stops.length <= MAX_WAYPOINTS_PER_REQUEST) {
    return fetchLegsForChunk(origin, stops, departureDate, apiKey, lastStopId);
  }

  const preOrdered = nearestNeighborOrder(origin, stops, lastStopId);
  const chunks = chunkPoints(preOrdered, MAX_WAYPOINTS_PER_REQUEST);
  const legs: RouteLeg[] = [];
  let chunkOrigin: RouteOrigin = origin;
  let chunkDepartureDate = departureDate;

  for (const [chunkIndex, stopsChunk] of chunks.entries()) {
    const isFinalChunk = chunkIndex === chunks.length - 1;
    const chunkLastStopId = isFinalChunk ? lastStopId : undefined;
    const chunkLegs = await fetchLegsForChunk(chunkOrigin, stopsChunk, chunkDepartureDate, apiKey, chunkLastStopId);
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

// Free, no-signup-required public routing server (OSRM demo instance) — used
// as a real-road fallback when there's no Google Directions API key, instead
// of falling straight to the straight-line/assumed-speed estimate. It's a
// shared public demo (no SLA, can be slow or rate-limited under load), so
// callers should still fall back to the straight line if this itself fails.
// Fixed order only (no route optimization) — matches exactly what
// fetchRoutePolyline needs, since the stop order here is already decided.
const OSRM_ROUTE_ENDPOINT = "https://router.project-osrm.org/route/v1/driving/";
// Per-request chunk size, not a total cap — the public demo server limits how
// many coordinates it'll accept in one call, so requests above this are split
// into multiple chunks and stitched together (see fetchOsrmRoutePolyline /
// computeOsrmTripLegs) rather than having the tail silently dropped.
const MAX_OSRM_WAYPOINTS = 50;

type OsrmRouteResponse = {
  code: string;
  routes: {
    geometry: string;
    legs: { distance: number; duration: number }[];
  }[];
};

function toOsrmCoordinate(point: { latitude: number; longitude: number }) {
  return `${point.longitude},${point.latitude}`;
}

async function fetchOsrmRoutePolylineChunk(origin: RouteLatLng, orderedPoints: RoutePoint[]): Promise<RoutePolylineResult> {
  const coordinatesParam = [origin, ...orderedPoints].map(toOsrmCoordinate).join(";");
  const url = `${OSRM_ROUTE_ENDPOINT}${coordinatesParam}?overview=full&geometries=polyline`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new RouteDirectionsError(`OSRM request failed (${response.status}).`, "REQUEST_FAILED");
  }

  const body = (await response.json()) as OsrmRouteResponse;
  const [route] = body.routes;
  if (body.code !== "Ok" || !route) {
    throw new RouteDirectionsError("No route returned.", "ZERO_RESULTS");
  }

  const legs: RouteLeg[] = route.legs.map((leg, index) => ({
    point: orderedPoints[index],
    distanceKm: leg.distance / 1000,
    durationSec: leg.duration,
  }));

  return { coordinates: decodePolyline(route.geometry), legs };
}

// The public demo server caps how many coordinates it'll accept per request —
// beyond that, split into chunks (same approach as fetchRoutePolyline for
// Google) and stitch them together so no selected stop is ever dropped.
export async function fetchOsrmRoutePolyline(origin: RouteLatLng, orderedPoints: RoutePoint[]): Promise<RoutePolylineResult> {
  if (!orderedPoints.length) {
    return { coordinates: [], legs: [] };
  }

  const chunks = chunkPoints(orderedPoints, MAX_OSRM_WAYPOINTS);
  const coordinates: RouteLatLng[] = [];
  const legs: RouteLeg[] = [];
  let chunkOrigin = origin;

  for (const chunk of chunks) {
    const chunkResult = await fetchOsrmRoutePolylineChunk(chunkOrigin, chunk);
    coordinates.push(...chunkResult.coordinates);
    legs.push(...chunkResult.legs);
    chunkOrigin = chunk.at(-1)!;
  }

  return { coordinates, legs };
}

// Same free OSRM server, but its "trip" endpoint — an approximate
// traveling-salesman solver over the REAL road network, not just straight-
// line distance. This is the free equivalent of Google's `waypoints=
// optimize:true`: used as the fallback for stop ORDER + realistic cumulative
// ETA on the list screen, one tier above the instant straight-line preview
// (nearestNeighborOrder) and one tier below paid Google (if configured).
const OSRM_TRIP_ENDPOINT = "https://router.project-osrm.org/trip/v1/driving/";

type OsrmTripResponse = {
  code: string;
  trips: { legs: { distance: number; duration: number }[] }[];
  waypoints: { waypoint_index: number }[];
};

async function fetchOsrmTripLegsForChunk(origin: RouteOrigin, chunk: RoutePoint[], pinLastInChunk: boolean): Promise<RouteLeg[]> {
  const coordinatesParam = [origin, ...chunk].map(toOsrmCoordinate).join(";");
  const params = new URLSearchParams({
    source: "first",
    destination: pinLastInChunk ? "last" : "any",
    roundtrip: "false",
  });
  const url = `${OSRM_TRIP_ENDPOINT}${coordinatesParam}?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new RouteDirectionsError(`OSRM trip request failed (${response.status}).`, "REQUEST_FAILED");
  }

  const body = (await response.json()) as OsrmTripResponse;
  const [trip] = body.trips;
  if (body.code !== "Ok" || !trip) {
    throw new RouteDirectionsError("No trip returned.", "ZERO_RESULTS");
  }

  // waypoints[0] is the origin (source=first pins it at trip position 0);
  // waypoints[1..] line up 1:1 with `chunk` in input order, each carrying
  // its actual position in the computed trip via waypoint_index.
  const orderedStops = body.waypoints
    .slice(1)
    .map((waypoint, inputIndex) => ({ point: chunk[inputIndex], order: waypoint.waypoint_index }))
    .sort((left, right) => left.order - right.order)
    .map((entry) => entry.point);

  return orderedStops.map((point, index) => {
    const leg = trip.legs[index];
    return {
      point,
      distanceKm: leg.distance / 1000,
      durationSec: leg.duration,
    };
  });
}

// >MAX_OSRM_WAYPOINTS stops: same strategy as computeRouteLegs' Google chunking
// — pre-sort with straight-line nearest-neighbor, then run the real trip
// solver in chunks so every selected stop makes it into the route instead of
// being silently dropped past the demo server's per-request limit.
export async function computeOsrmTripLegs(origin: RouteOrigin, stops: RoutePoint[], lastStopId?: string): Promise<RouteLeg[]> {
  if (!stops.length) {
    return [];
  }

  if (stops.length <= MAX_OSRM_WAYPOINTS) {
    const pinnedLast = lastStopId ? stops.find((stop) => stop.id === lastStopId) : undefined;
    const ordered = pinnedLast ? [...stops.filter((stop) => stop.id !== lastStopId), pinnedLast] : stops;
    return fetchOsrmTripLegsForChunk(origin, ordered, Boolean(pinnedLast));
  }

  const preOrdered = nearestNeighborOrder(origin, stops, lastStopId);
  const chunks = chunkPoints(preOrdered, MAX_OSRM_WAYPOINTS);
  const legs: RouteLeg[] = [];
  let chunkOrigin: RouteOrigin = origin;

  for (const [chunkIndex, stopsChunk] of chunks.entries()) {
    const isFinalChunk = chunkIndex === chunks.length - 1;
    const pinLastInChunk = isFinalChunk && Boolean(lastStopId);
    const chunkLegs = await fetchOsrmTripLegsForChunk(chunkOrigin, stopsChunk, pinLastInChunk);
    legs.push(...chunkLegs);
    chunkOrigin = { ...chunkLegs.at(-1)!.point, label: "" };
  }

  return legs;
}
