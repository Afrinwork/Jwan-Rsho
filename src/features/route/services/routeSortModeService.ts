import { distanceKm } from "@/src/features/map/utils/circleMath";
import { RouteOrigin, RoutePoint } from "@/src/features/route/types/routeTypes";

// How the route list is ordered before the trip starts (RouteScreen):
// - optimized: shortest drive (Google/OSRM route optimization, the default)
// - nearest:   closest to the start point first, straight-line distance
// - farthest:  farthest from the start point first (drive out, work back)
// - city:      city by city — nearest city first, stops within a city in
//              nearest-neighbor order
// A hand-made order (moving a stop) always wins over all of these; see
// useRouteOrder / manualOrderIds.
export type RouteSortMode = "optimized" | "nearest" | "farthest" | "city";

export const ROUTE_SORT_MODES: RouteSortMode[] = ["optimized", "nearest", "farthest", "city"];

type SortablePoint = RoutePoint & { city?: string };

function normalizeCity(city: string | undefined) {
  return (city ?? "").trim().toLowerCase();
}

function nearestNeighbor<T extends RoutePoint>(from: RoutePoint | RouteOrigin, points: T[]): T[] {
  const remaining = [...points];
  const ordered: T[] = [];
  let current: RoutePoint | RouteOrigin = from;

  while (remaining.length) {
    let bestIndex = 0;
    for (let index = 1; index < remaining.length; index += 1) {
      if (distanceKm(current, remaining[index]) < distanceKm(current, remaining[bestIndex])) bestIndex = index;
    }
    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    current = next;
  }

  return ordered;
}

// Fixed stop order for every mode except "optimized" (which is left to the
// routing providers and returns null here).
export function presetRouteOrder<T extends SortablePoint>(mode: RouteSortMode, origin: RouteOrigin, points: T[]): T[] | null {
  switch (mode) {
    case "optimized":
      return null;
    case "nearest":
      return [...points].sort((left, right) => distanceKm(origin, left) - distanceKm(origin, right));
    case "farthest":
      return [...points].sort((left, right) => distanceKm(origin, right) - distanceKm(origin, left));
    case "city": {
      const byCity = new Map<string, T[]>();
      for (const point of points) {
        const key = normalizeCity(point.city);
        byCity.set(key, [...(byCity.get(key) ?? []), point]);
      }

      const ordered: T[] = [];
      let current: RoutePoint | RouteOrigin = origin;
      const cities = [...byCity.values()];
      while (cities.length) {
        // Next city = the one whose closest stop is nearest to where we are.
        let bestIndex = 0;
        let bestDistance = Infinity;
        cities.forEach((cityPoints, index) => {
          const closest = Math.min(...cityPoints.map((point) => distanceKm(current, point)));
          if (closest < bestDistance) {
            bestDistance = closest;
            bestIndex = index;
          }
        });
        const [cityPoints] = cities.splice(bestIndex, 1);
        const cityOrder: T[] = nearestNeighbor(current, cityPoints);
        ordered.push(...cityOrder);
        current = cityOrder[cityOrder.length - 1];
      }
      return ordered;
    }
  }
}
