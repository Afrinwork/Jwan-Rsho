import { requireSupabase } from "@/src/repositories/supabase/repositoryContext";
import { useAuthStore } from "@/src/store/authStore";
import { DriverLiveLocation, DriverLiveLocationSource } from "@/src/types/driverLiveLocation";
import { generateUuid } from "@/src/utils/uuid";

type DriverLiveLocationRow = {
  driver_id: string;
  latitude: number;
  longitude: number;
  source: string;
  updated_at: string;
  last_customer_name: string | null;
  last_customer_at: string | null;
};

function mapRow(row: DriverLiveLocationRow): DriverLiveLocation {
  return {
    driverId: row.driver_id,
    latitude: row.latitude,
    longitude: row.longitude,
    source: row.source as DriverLiveLocationSource,
    updatedAt: row.updated_at,
    lastCustomerName: row.last_customer_name,
    lastCustomerAt: row.last_customer_at,
  };
}

// Table not created yet (migration 20261026120000 not applied).
function isMissingTable(error: { code?: string }) {
  return error.code === "42P01" || error.code === "PGRST205";
}

export const driverLiveLocationRepository = {
  // Drivers only — anyone else is a no-op, so callers don't need to check.
  // Upsert only touches the columns it's given (PostgREST merge-duplicates),
  // so a position update keeps the last customer and vice versa.
  async report(input: {
    latitude: number;
    longitude: number;
    source: DriverLiveLocationSource;
    lastCustomerName?: string;
  }) {
    const user = useAuthStore.getState().currentUser;
    if (user?.role !== "driver") return;

    const timestamp = new Date().toISOString();
    const { error } = await requireSupabase()
      .from("driver_live_locations")
      .upsert({
        driver_id: user.uid,
        latitude: input.latitude,
        longitude: input.longitude,
        source: input.source,
        updated_at: timestamp,
        ...(input.lastCustomerName ? { last_customer_name: input.lastCustomerName, last_customer_at: timestamp } : {}),
      });
    if (error && !isMissingTable(error)) throw error;
  },

  subscribe(driverId: string, onChange: (location: DriverLiveLocation | null) => void, onError: (error: unknown) => void) {
    const client = requireSupabase();

    const fetchAndEmit = async () => {
      const { data, error } = await client.from("driver_live_locations").select("*").eq("driver_id", driverId).maybeSingle();
      if (error && isMissingTable(error)) {
        onChange(null);
        return;
      }
      if (error) {
        onError(error);
        return;
      }
      onChange(data ? mapRow(data as DriverLiveLocationRow) : null);
    };

    void fetchAndEmit();

    // Unique topic per subscription -- see driverCheckInRepository for why.
    const channel = client
      .channel(`driver_live_locations:${driverId}:${generateUuid()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_live_locations", filter: `driver_id=eq.${driverId}` },
        () => void fetchAndEmit(),
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  },
};
