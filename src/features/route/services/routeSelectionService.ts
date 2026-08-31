import { RouteStop } from "@/src/features/route/types/routeTypes";

export function toggleStopSelection(selectedIds: string[], stopId: string) {
  return selectedIds.includes(stopId)
    ? selectedIds.filter((value) => value !== stopId)
    : [...selectedIds, stopId];
}

export function selectAllStopIds(stops: RouteStop[]) {
  return stops.map((stop) => stop.marker.id);
}

export function resetStopSelection() {
  return [] as string[];
}
