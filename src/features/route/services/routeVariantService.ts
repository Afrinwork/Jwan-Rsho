import { distanceKm } from "@/src/features/map/utils/circleMath";
import { RouteDistanceMatrix } from "@/src/features/route/services/routeDistanceMatrixService";
import { RouteOrigin, RoutePoint } from "@/src/features/route/types/routeTypes";

// "Another route" on the route list: every tap shows a different, still
// sensible order of the same stops. Variant N is always the same route (the
// randomness is seeded), so the list doesn't reshuffle on a re-render.

// Small seeded PRNG (mulberry32).
function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// Index 0 is the start, 1..n the stops — computed once per call, so even
// long routes stay fast across many attempts. Real driving distances when
// given (routeDistanceMatrixService), the straight line for anything else.
function distanceMatrix(origin: RouteOrigin, points: RoutePoint[], roadMatrix?: RouteDistanceMatrix | null) {
  const all = [origin, ...points];
  return all.map((from, i) =>
    all.map((to, j) => {
      const road = roadMatrix?.[i]?.[j];
      return road !== undefined && Number.isFinite(road) ? road : distanceKm(from, to);
    }),
  );
}

// The plain greedy walk (always the closest remaining stop).
function greedy(matrix: number[][], stopCount: number) {
  return randomizedGreedy(matrix, stopCount, () => 0);
}

// Greedy walk from the start that picks one of the three closest remaining
// stops (closer ones more likely) instead of always the closest.
function randomizedGreedy(matrix: number[][], stopCount: number, random: () => number) {
  const remaining = Array.from({ length: stopCount }, (_, index) => index + 1);
  const route: number[] = [];
  let current = 0;

  while (remaining.length) {
    const closest = [...remaining].sort((left, right) => matrix[current][left] - matrix[current][right]).slice(0, 3);
    const roll = random();
    const pick = closest[roll < 0.6 || closest.length === 1 ? 0 : roll < 0.88 || closest.length === 2 ? 1 : 2];
    remaining.splice(remaining.indexOf(pick), 1);
    route.push(pick);
    current = pick;
  }

  return route;
}

// 2-opt on the open path start -> stops: reverses a stretch whenever that
// makes the drive shorter, which irons out crossings and back-and-forth legs.
function twoOpt(matrix: number[][], route: number[], maxPasses = 8) {
  const path = [0, ...route];
  for (let pass = 0; pass < maxPasses; pass += 1) {
    let improved = false;
    for (let i = 1; i < path.length - 1; i += 1) {
      for (let j = i + 1; j < path.length; j += 1) {
        const after = j + 1 < path.length ? path[j + 1] : null;
        const before = matrix[path[i - 1]][path[i]] + (after === null ? 0 : matrix[path[j]][after]);
        const reversed = matrix[path[i - 1]][path[j]] + (after === null ? 0 : matrix[path[i]][after]);
        if (reversed < before - 1e-9) {
          path.splice(i, j - i + 1, ...path.slice(i, j + 1).reverse());
          improved = true;
        }
      }
    }
    if (!improved) break;
  }
  return path.slice(1);
}

// The best single order this file can find: closest-stop chain, then 2-opt.
// Used to re-sort the remaining stops mid-drive from where the driver is.
export function optimizedRemainingOrder<T extends RoutePoint>(origin: RouteOrigin, points: T[], roadMatrix?: RouteDistanceMatrix | null): T[] {
  if (points.length < 2) return [...points];
  const matrix = distanceMatrix(origin, points, roadMatrix);
  return twoOpt(matrix, greedy(matrix, points.length)).map((index) => points[index - 1]);
}

export function alternativeRouteOrder<T extends RoutePoint>(
  origin: RouteOrigin,
  points: T[],
  variantIndex: number,
  roadMatrix?: RouteDistanceMatrix | null,
): T[] {
  if (points.length < 2) return [...points];

  const matrix = distanceMatrix(origin, points, roadMatrix);
  const seen = new Set<string>();
  const variants: number[][] = [];
  const maxAttempts = (Math.max(variantIndex, 0) + 1) * 6;

  for (let attempt = 0; variants.length <= variantIndex && attempt < maxAttempts; attempt += 1) {
    const raw = randomizedGreedy(matrix, points.length, seededRandom(attempt + 1));
    // The smoothed route first; when that one was already shown (few stops
    // often smooth into the same order), the raw walk still gives a new one.
    for (const candidate of [twoOpt(matrix, raw), raw]) {
      const key = candidate.join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      variants.push(candidate);
      break;
    }
  }

  // Fewer distinct routes than taps (only a handful of stops): start over.
  const chosen = variants[variantIndex % variants.length];
  return chosen.map((index) => points[index - 1]);
}
