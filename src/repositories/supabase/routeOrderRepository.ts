import { requireCurrentUserId, requireSupabase } from "@/src/repositories/supabase/repositoryContext";
import { ActiveTrip, RouteOrder } from "@/src/types/routeOrder";
import { generateUuid } from "@/src/utils/uuid";

type RouteOrderRow = {
  user_id: string;
  customer_ids: string[];
  updated_by: string;
  updated_at: string;
  trip_customer_ids?: string[] | null;
  trip_current_customer_id?: string | null;
  trip_updated_at?: string | null;
};

function mapRow(row: RouteOrderRow): RouteOrder {
  return {
    userId: row.user_id,
    customerIds: row.customer_ids ?? [],
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
    trip: row.trip_customer_ids?.length
      ? { customerIds: row.trip_customer_ids, currentCustomerId: row.trip_current_customer_id ?? null, updatedAt: row.trip_updated_at ?? row.updated_at }
      : null,
  };
}

// Upsert only touches the columns it's given (PostgREST merge-duplicates),
// so saving the list never wipes the trip and vice versa.
async function upsertColumns(userId: string, columns: Record<string, unknown>) {
  const { error } = await requireSupabase()
    .from("route_orders")
    .upsert({ user_id: userId, updated_by: requireCurrentUserId(), updated_at: new Date().toISOString(), ...columns });
  if (error) throw error;
}

export const routeOrderRepository = {
  subscribeToRouteOrder(userId: string, onChange: (order: RouteOrder | null) => void, onError: (error: unknown) => void) {
    const client = requireSupabase();

    const fetchAndEmit = async () => {
      const { data, error } = await client.from("route_orders").select("*").eq("user_id", userId).maybeSingle();
      // Table not created yet (migration 20260926180000 not applied):
      // behave like "nothing saved" = automatic sorting.
      if (error && (error.code === "42P01" || error.code === "PGRST205")) {
        onChange(null);
        return;
      }
      if (error) {
        onError(error);
        return;
      }
      onChange(data ? mapRow(data as RouteOrderRow) : null);
    };

    void fetchAndEmit();

    // Unique topic per subscription -- see driverCheckInRepository for why.
    const channel = client
      .channel(`route_orders:${userId}:${generateUuid()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "route_orders", filter: `user_id=eq.${userId}` }, () => void fetchAndEmit())
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  },

  async saveRouteOrder(userId: string, customerIds: string[]) {
    await upsertColumns(userId, { customer_ids: customerIds });
  },

  // Empties the saved list (= automatic sorting) but keeps the row, so a
  // trip in progress stored next to it isn't lost.
  async clearRouteOrder(userId: string) {
    await upsertColumns(userId, { customer_ids: [] });
  },

  // The driver's trip in progress, or null once they leave the trip screen.
  async saveActiveTrip(userId: string, trip: Omit<ActiveTrip, "updatedAt"> | null) {
    await upsertColumns(userId, {
      trip_customer_ids: trip?.customerIds ?? null,
      trip_current_customer_id: trip?.currentCustomerId ?? null,
      trip_updated_at: trip ? new Date().toISOString() : null,
    });
  },
};
