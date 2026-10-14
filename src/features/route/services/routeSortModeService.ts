import { RouteDistance, RouteDistanceMatrix, routeDistance } from "@/src/features/route/services/routeDistanceMatrixService";
import { alternativeRouteOrder } from "@/src/features/route/services/routeVariantService";
import { RouteOrigin, RoutePoint } from "@/src/features/route/types/routeTypes";

// How the route list is ordered before the trip starts (RouteScreen):
// - optimized: shortest drive (Google/OSRM route optimization)
// - nearest:   (the default) a chain: from the start to the closest stop, then always on
//              to the closest remaining one (straight-line distance)
// - farthest:  the farthest stop from the start first, then the same chain
//              from there back (drive out, work back)
// - city:      city by city — nearest city first, stops within a city in
//              nearest-neighbor order
// A hand-made order (moving a stop) always wins over all of these; see
// useRouteOrder / manualOrderIds.
// - alternative: "another route" — a new sensible order on every tap (see
//              routeVariantService), picked via its own chip, not this list
export type RouteSortMode = "optimized" | "nearest" | "farthest" | "city" | "alternative";

export const ROUTE_SORT_MODES: RouteSortMode[] = ["optimized", "nearest", "farthest", "city"];

type SortablePoint = RoutePoint & { city?: string };

function normalizeCity(city: string | undefined) {
  return (city ?? "").trim().toLowerCase();
}

function nearestNeighbor<T extends RoutePoint>(from: RoutePoint | RouteOrigin, points: T[], distance: RouteDistance): T[] {
  const remaining = [...points];
  const ordered: T[] = [];
  let current: RoutePoint | RouteOrigin = from;

  while (remaining.length) {
    let bestIndex = 0;
    for (let index = 1; index < remaining.length; index += 1) {
      if (distance(current, remaining[index]) < distance(current, remaining[bestIndex])) bestIndex = index;
    }
    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    current = next;
  }

  return ordered;
}

// Fixed stop order for every mode except "optimized" (which is left to the
// routing providers and returns null here). `matrix` holds real driving
// distances for [origin, ...points] in this order (routeDistanceMatrixService);
// without it everything is measured as the crow flies.
export function presetRouteOrder<T extends SortablePoint>(
  mode: RouteSortMode,
  origin: RouteOrigin,
  points: T[],
  variantIndex = 0,
  matrix: RouteDistanceMatrix | null = null,
): T[] | null {
  const distance = routeDistance(origin, points, matrix);
  switch (mode) {
    case "alternative":
      return alternativeRouteOrder(origin, points, variantIndex, matrix);
    case "optimized":
      return null;
    // Sorting by distance from the start alone zigzagged: stops at the same
    // distance on opposite sides of a city came right after each other.
    case "nearest":
      return nearestNeighbor(origin, points, distance);
    case "farthest": {
      if (!points.length) return [];
      const farthest = points.reduce((best, point) => (distance(origin, point) > distance(origin, best) ? point : best));
      return [farthest, ...nearestNeighbor(farthest, points.filter((point) => point !== farthest), distance)];
    }
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
          const closest = Math.min(...cityPoints.map((point) => distance(current, point)));
          if (closest < bestDistance) {
            bestDistance = closest;
            bestIndex = index;
          }
        });
        const [cityPoints] = cities.splice(bestIndex, 1);
        const cityOrder: T[] = nearestNeighbor(current, cityPoints, distance);
        ordered.push(...cityOrder);
        current = cityOrder[cityOrder.length - 1];
      }
      return ordered;
    }
  }
}
