import { collection, doc, onSnapshot, query, runTransaction, where } from "firebase/firestore";

import { mapSnapshot, requireDb, resolveOwnerScope } from "@/src/repositories/repositoryContext.firebase";
import { getBerlinDateKey } from "@/src/utils/time/europeBerlin";

export type DriverCompletionStat = {
  id: string;
  ownerId: string;
  driverId: string;
  date: string;
  count: number;
};

export function todayKey() {
  return getBerlinDateKey(new Date());
}

export const driverStatsRepository = {
  // Called from orderRepository.completeOrder() for the completed order's
  // assignedDriverId, if any. Self-resets to 1 whenever the stored date is
  // not today, so there's exactly one doc per driver — no cleanup job needed
  // for old days.
  async recordCompletion(driverId: string) {
    const { ownerId } = resolveOwnerScope();
    const db = requireDb();
    const ref = doc(db, "driverCompletionStats", driverId);
    const today = todayKey();

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      const isSameDay = snapshot.exists() && snapshot.data().date === today;
      transaction.set(ref, {
        ownerId,
        driverId,
        date: today,
        count: isSameDay ? (snapshot.data().count as number) + 1 : 1,
      });
    });
  },

  // Live view of every one of the caller's own drivers' stat docs at once —
  // used by the driver dashboard to show a "completed today" count per row.
  subscribeToOwnDriverStats(onChange: (stats: DriverCompletionStat[]) => void, onError: (error: unknown) => void) {
    const { ownerId } = resolveOwnerScope();
    const statsQuery = query(collection(requireDb(), "driverCompletionStats"), where("ownerId", "==", ownerId));
    return onSnapshot(
      statsQuery,
      (snapshot) => onChange(snapshot.docs.map((value) => mapSnapshot<DriverCompletionStat>(value))),
      onError,
    );
  },
};
