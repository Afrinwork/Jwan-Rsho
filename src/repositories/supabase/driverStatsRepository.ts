import { toCamelCase } from "@/src/repositories/supabase/caseMapping";
import { requireSupabase, resolveOwnerScope } from "@/src/repositories/supabase/repositoryContext";
import { getBerlinDateKey } from "@/src/utils/time/europeBerlin";
import { generateUuid } from "@/src/utils/uuid";

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
  // Called from orderRepository.completeOrder() for the completed
  // order's assignedDriverId, if any. Atomic upsert (see
  // record_driver_completion in supabase/migrations) -- the "same day ?
  // increment : reset to 1" branch that needed a Firestore transaction
  // is now a single ON CONFLICT DO UPDATE.
  async recordCompletion(driverId: string) {
    const { ownerId } = resolveOwnerScope();
    const { error } = await requireSupabase().rpc("record_driver_completion", {
      p_driver_id: driverId,
      p_owner_id: ownerId,
      p_date: todayKey(),
    });
    if (error) throw error;
  },

  // Live view of every one of the caller's own drivers' stat rows at
  // once -- used by the driver dashboard's "completed today" count per
  // row. Refetches on every change instead of hand-reconciling
  // incremental payloads, matching the simple "fires now, then again on
  // every change" contract the Firestore listener gave for free.
  subscribeToOwnDriverStats(onChange: (stats: DriverCompletionStat[]) => void, onError: (error: unknown) => void) {
    const client = requireSupabase();
    const { ownerId } = resolveOwnerScope();

    const fetchAndEmit = async () => {
      const { data, error } = await client.from("driver_completion_stats").select("*").eq("owner_id", ownerId);
      if (error) {
        onError(error);
        return;
      }
      onChange((data ?? []).map((row) => toCamelCase<DriverCompletionStat>({ ...row, id: row.driver_id })));
    };

    void fetchAndEmit();

    // Unique per subscription instance -- a topic shared across
    // concurrent callers makes supabase-js return the same
    // already-subscribed channel object for the second caller, and
    // chaining .on(...) onto that throws (see orderRepository.ts).
    const channel = client
      .channel(`driver_completion_stats:${ownerId}:${generateUuid()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_completion_stats", filter: `owner_id=eq.${ownerId}` },
        () => void fetchAndEmit(),
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  },
};
