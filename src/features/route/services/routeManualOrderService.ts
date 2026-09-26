import { RoutePoint } from "@/src/features/route/types/routeTypes";

// Moves `id` to the 1-based `position` (clamped to the list), keeping every
// other id's relative order — "customer 3 becomes customer 15" on the route
// list screen. Returns the same array when nothing would change.
export function moveIdToPosition(ids: string[], id: string, position: number): string[] {
  const fromIndex = ids.indexOf(id);
  if (fromIndex === -1 || !Number.isFinite(position)) {
    return ids;
  }

  const toIndex = Math.min(Math.max(Math.round(position) - 1, 0), ids.length - 1);
  if (toIndex === fromIndex) {
    return ids;
  }

  const next = ids.filter((value) => value !== id);
  next.splice(toIndex, 0, id);
  return next;
}

// Orders points by the driver's manual order. Ids in the manual order that
// no longer exist (order completed meanwhile) are dropped; points that
// aren't in it yet (e.g. newly added) keep their incoming order at the end,
// so a manual sort never hides a stop.
export function applyManualOrder<T extends Pick<RoutePoint, "id">>(points: T[], manualOrderIds: string[]): T[] {
  const pointById = new Map(points.map((point) => [point.id, point]));
  const ordered = manualOrderIds.map((id) => pointById.get(id)).filter((point) => point !== undefined);
  const orderedIds = new Set(ordered.map((point) => point.id));
  return [...ordered, ...points.filter((point) => !orderedIds.has(point.id))];
}

export const MAX_SAVED_ROUTE_ORDER_IDS = 2000;

// A saved list covers every customer the person ever sorted, not just the
// ones on today's route — so saving the order of the current route puts
// those ids first (in their new order) and keeps the rest of the saved
// list behind them, instead of forgetting how other stops were sorted.
export function mergeRouteOrder(savedIds: string[] | null, orderedIds: string[]): string[] {
  const ordered = new Set(orderedIds);
  return [...orderedIds, ...(savedIds ?? []).filter((id) => !ordered.has(id))].slice(0, MAX_SAVED_ROUTE_ORDER_IDS);
}
