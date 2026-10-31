import { useCallback, useEffect, useState } from "react";

import { mergeRouteOrder } from "@/src/features/route/services/routeManualOrderService";
import { routeOrderRepository } from "@/src/repositories/routeOrderRepository";
import { SyncedActiveTrip } from "@/src/features/route/services/activeTripStorage.shared";
import { ActiveTrip } from "@/src/types/routeOrder";
import { formatError } from "@/src/utils/formatError";

// The repositories throw synchronously when no backend is configured — a
// missing saved order must never take the route screen down with it.
function subscribeSafely(subscribe: () => () => void, onError: (error: unknown) => void) {
  try {
    return subscribe();
  } catch (error) {
    onError(error);
    return undefined;
  }
}

// Live view of one person's saved stop order ("their list") — the user's
// own, or, from the admin driver view, one of their drivers'. Changes from
// the other side (driver <-> manager) arrive through the subscription;
// local edits are applied optimistically so the list reacts immediately.
// `savedIds` is null while no order is saved (= automatic sorting).
export function useRouteOrder(userId: string | null) {
  const [savedIds, setSavedIds] = useState<string[] | null>(null);
  // The person's trip in progress, if any (only drivers publish one).
  const [trip, setTrip] = useState<ActiveTrip | null>(null);
  // The person's own map trip as last synced by any of their phones.
  const [tripState, setTripState] = useState<SyncedActiveTrip | null>(null);
  const [error, setError] = useState<string | null>(null);
  // False until the first saved order (or "none") has arrived.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;

    return subscribeSafely(
      () =>
        routeOrderRepository.subscribeToRouteOrder(
          userId,
          (order) => {
            // Every own trip-mirror write comes back through here: keep the
            // same array/object when nothing changed, so the map doesn't
            // re-sort and re-render on each echo.
            const nextIds = order?.customerIds.length ? order.customerIds : null;
            setSavedIds((current) => (current?.join(",") === nextIds?.join(",") ? current : nextIds));
            const nextTrip = order?.trip ?? null;
            setTrip((current) => (JSON.stringify(current) === JSON.stringify(nextTrip) ? current : nextTrip));
            const nextTripState = order?.tripState ?? null;
            setTripState((current) => (current?.savedAt === nextTripState?.savedAt && current?.deviceId === nextTripState?.deviceId ? current : nextTripState));
            setLoaded(true);
            setError(null);
          },
          (subscribeError) => setError(formatError(subscribeError).message),
        ),
      (subscribeError) => setError(formatError(subscribeError).message),
    );
  }, [userId]);

  const save = useCallback(
    async (orderedIds: string[]) => {
      if (!userId) return;
      const next = mergeRouteOrder(savedIds, orderedIds);
      const previous = savedIds;
      setSavedIds(next);
      setError(null);

      try {
        await routeOrderRepository.saveRouteOrder(userId, next);
      } catch (saveError) {
        setSavedIds(previous);
        setError(formatError(saveError).message);
      }
    },
    [savedIds, userId],
  );

  const clear = useCallback(async () => {
    if (!userId) return;
    const previous = savedIds;
    setSavedIds(null);
    setError(null);

    try {
      await routeOrderRepository.clearRouteOrder(userId);
    } catch (clearError) {
      setSavedIds(previous);
      setError(formatError(clearError).message);
    }
  }, [savedIds, userId]);

  // Best effort: the trip mirror is a convenience for the admin view, a
  // failed write must never disturb the drive itself.
  const saveTrip = useCallback(
    async (next: Omit<ActiveTrip, "updatedAt"> | null) => {
      if (!userId) return;
      try {
        await routeOrderRepository.saveActiveTrip(userId, next);
      } catch {
        // ignored on purpose
      }
    },
    [userId],
  );

  // Best effort as well: syncing to the other phones must never disturb
  // the trip on this one.
  const saveTripState = useCallback(
    async (next: SyncedActiveTrip) => {
      if (!userId) return;
      try {
        await routeOrderRepository.saveTripState(userId, next);
      } catch {
        // ignored on purpose
      }
    },
    [userId],
  );

  return { savedIds, loaded, trip, tripState, error, save, clear, saveTrip, saveTripState };
}
