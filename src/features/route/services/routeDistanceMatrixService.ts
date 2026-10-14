import { distanceKm } from "@/src/features/map/utils/circleMath";
import { RouteOrigin, RoutePoint } from "@/src/features/route/types/routeTypes";

// Real driving distances between all stops (and the start), so the preset
// sort modes and "another route" don't treat a stop across a river or a
// motorway as "close" just because it is close as the crow flies.
//
// Row/column 0 is the start, 1..n the points in the order given. Values are
// km; a pair the router couldn't connect is Infinity (callers fall back to
// the straight line for it).
export type RouteDistanceMatrix = number[][];

type Located = { latitude: number; longitude: number };
export type RouteDistance = (from: Located, to: Located) => number;

// Same free public OSRM server the route list already uses for legs.
const OSRM_TABLE_ENDPOINT = "https://router.project-osrm.org/table/v1/driving/";
// The public demo server rejects larger tables; above this the sort modes
// simply keep using straight-line distance.
export const MAX_MATRIX_LOCATIONS = 100;
const REQUEST_TIMEOUT_MS = 8000;
const CACHE_SIZE = 8;

const cache = new Map<string, RouteDistanceMatrix>();

function cacheKey(origin: Located, points: RoutePoint[]) {
  // ~10 m precision: a GPS start that jitters slightly reuses the matrix.
  return [origin, ...points].map((point) => `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`).join(";");
}

export async function fetchRoadDistanceMatrix(origin: RouteOrigin, points: RoutePoint[]): Promise<RouteDistanceMatrix | null> {
  if (!points.length || points.length + 1 > MAX_MATRIX_LOCATIONS) return null;

  const key = cacheKey(origin, points);
  const cached = cache.get(key);
  if (cached) return cached;

  const coordinates = [origin, ...points].map((point) => `${point.longitude},${point.latitude}`).join(";");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OSRM_TABLE_ENDPOINT}${coordinates}?annotations=distance`, { signal: controller.signal });
    if (!response.ok) return null;
    const body = (await response.json()) as { code: string; distances?: (number | null)[][] };
    if (body.code !== "Ok" || !body.distances) return null;

    const matrix = body.distances.map((row) => row.map((meters) => (meters === null ? Infinity : meters / 1000)));
    cache.set(key, matrix);
    if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!);
    return matrix;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Distance lookup over [origin, ...points] (by object identity), falling
// back to the straight line for anything the matrix doesn't cover.
export function routeDistance(origin: Located, points: Located[], matrix: RouteDistanceMatrix | null | undefined): RouteDistance {
  if (!matrix) return distanceKm;
  const indexOf = new Map<Located, number>([[origin, 0], ...points.map((point, index) => [point, index + 1] as [Located, number])]);
  return (from, to) => {
    const fromIndex = indexOf.get(from);
    const toIndex = indexOf.get(to);
    const value = fromIndex === undefined || toIndex === undefined ? undefined : matrix[fromIndex]?.[toIndex];
    return value !== undefined && Number.isFinite(value) ? value : distanceKm(from, to);
  };
}
