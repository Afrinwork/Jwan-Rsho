import { toCamelCase } from "@/src/repositories/supabase/caseMapping";
import { requireSupabase, resolveOwnerScope } from "@/src/repositories/supabase/repositoryContext";
import { DriverCheckIn } from "@/src/types/driverCheckIn";
import { getBerlinDateKey, isPastMorningWindow } from "@/src/utils/time/europeBerlin";
import { generateUuid } from "@/src/utils/uuid";

export type CheckInAttemptFailureReason =
  | "permission_denied"
  | "photo_cancelled"
  | "submit_failed"
  | "left_flow"
  | "gps_imprecise";

function mapCheckInRow(row: Record<string, unknown>): DriverCheckIn {
  const mapped = toCamelCase<DriverCheckIn>(row);
  // odometer_km is a Postgres `numeric` column -- postgrest-js returns
  // those as strings (unlike the double-precision lat/lng/gpsAccuracy
  // columns on this same table), so Number.isFinite(odometerKm) checks
  // downstream (e.g. the admin dashboard) would otherwise always be false
  // and silently show "no odometer" even when a real value was submitted.
  const odometerKm = mapped.odometerKm === undefined ? undefined : Number(mapped.odometerKm);
  return { ...mapped, odometerKm, id: `${mapped.driverId}_${mapped.date}` };
}

export const driverCheckInRepository = {
  // Reads the driver's own check-in row for today, without creating one
  // -- the row only comes into existence on the first
  // recordAttemptFailure() or submitCheckIn() call, same as
  // driverCompletionStats only appearing on first recordCompletion().
  async getTodayCheckIn(): Promise<DriverCheckIn> {
    const { ownerId, driverId } = resolveOwnerScope();
    if (!driverId) throw new Error("getTodayCheckIn() is only meaningful for a driver.");

    const date = getBerlinDateKey(new Date());
    const { data, error } = await requireSupabase()
      .from("driver_check_ins")
      .select("*")
      .eq("driver_id", driverId)
      .eq("date", date)
      .maybeSingle();
    if (error) throw error;

    if (data) return mapCheckInRow(data);

    const timestamp = new Date().toISOString();
    return {
      id: `${driverId}_${date}`,
      ownerId,
      driverId,
      date,
      status: "pending",
      attempts: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  },

  // reason is accepted purely so every call site documents why an
  // attempt failed -- not persisted, matching the current data model.
  // Atomic upsert (see record_checkin_attempt_failure in
  // supabase/migrations); the composite (driver_id, date) primary key
  // already makes "today's row" unambiguous, no read-then-branch needed.
  async recordAttemptFailure(reason: CheckInAttemptFailureReason) {
    void reason;
    const { ownerId, driverId } = resolveOwnerScope();
    if (!driverId) throw new Error("recordAttemptFailure() is only meaningful for a driver.");

    const { error } = await requireSupabase().rpc("record_checkin_attempt_failure", {
      p_driver_id: driverId,
      p_owner_id: ownerId,
      p_date: getBerlinDateKey(new Date()),
    });
    if (error) throw error;
  },

  // Uploads the photo to Storage FIRST, then calls submit_checkin -- a
  // failed upload must never leave a row claiming success with a
  // photoStoragePath pointing at nothing.
  async submitCheckIn(input: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
    odometerKm?: number;
    photoUri: string;
  }) {
    const { ownerId, driverId } = resolveOwnerScope();
    if (!driverId) throw new Error("submitCheckIn() is only meaningful for a driver.");

    const date = getBerlinDateKey(new Date());
    const photoStoragePath = `${ownerId}/${driverId}/${date}.jpg`;

    const response = await fetch(input.photoUri);
    const blob = await response.blob();
    const { error: uploadError } = await requireSupabase()
      .storage.from("driver-check-ins")
      .upload(photoStoragePath, blob, { contentType: "image/jpeg", upsert: true });
    if (uploadError) throw uploadError;

    // p_odometer_km is genuinely nullable at the SQL level -- same
    // codegen limitation as assign_customer_driver's p_driver_id
    // (function params aren't inferred as nullable even when the column
    // they populate allows NULL).
    const { error } = await requireSupabase().rpc("submit_checkin", {
      p_driver_id: driverId,
      p_owner_id: ownerId,
      p_date: date,
      p_address: input.address,
      p_latitude: input.latitude,
      p_longitude: input.longitude,
      p_gps_accuracy: input.accuracy,
      p_odometer_km: Number.isFinite(input.odometerKm) ? (input.odometerKm as number) : null,
      p_photo_storage_path: photoStoragePath,
    } as never);
    if (error) throw error;
  },

  async submitDailyStatus(input: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
    odometerKm: number;
  }) {
    const { ownerId, driverId } = resolveOwnerScope();
    if (!driverId) throw new Error("submitDailyStatus() is only meaningful for a driver.");
    if (!Number.isFinite(input.odometerKm) || input.odometerKm < 0) {
      throw new Error("A valid odometer reading is required.");
    }

    const client = requireSupabase();
    const now = new Date();
    const date = getBerlinDateKey(now);
    const timestamp = now.toISOString();
    const { data: existing, error: readError } = await client
      .from("driver_check_ins")
      .select("status")
      .eq("driver_id", driverId)
      .eq("date", date)
      .maybeSingle();
    if (readError) throw readError;
    if (existing?.status === "blocked") {
      throw new Error("Your manager must release your account before you can submit a report.");
    }
    if (isPastMorningWindow(now) && !existing) {
      throw new Error("The daily report deadline has passed. Please contact your manager.");
    }

    const values = {
      status: "ok",
      blocked_reason: null,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      gps_accuracy: input.accuracy,
      odometer_km: input.odometerKm,
      completed_at: timestamp,
      updated_at: timestamp,
    };
    const { error } = existing
      ? await client.from("driver_check_ins").update(values).eq("driver_id", driverId).eq("date", date)
      : await client.from("driver_check_ins").insert({
          driver_id: driverId,
          owner_id: ownerId,
          date,
          attempts: 0,
          created_at: timestamp,
          ...values,
        });
    if (error) throw error;
  },

  // Live view for the admin dashboard -- every one of the caller's own
  // drivers' check-in rows for a given Berlin date.
  // A voluntary position update never changes the check-in status, its photo,
  // or an admin block. It only keeps the manager dashboard current.
  async reportLiveStatus(input: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
    odometerKm?: number;
  }) {
    const { ownerId, driverId } = resolveOwnerScope();
    if (!driverId) throw new Error("reportLiveStatus() is only meaningful for a driver.");

    const client = requireSupabase();
    const date = getBerlinDateKey(new Date());
    const timestamp = new Date().toISOString();
    const location = {
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      gps_accuracy: input.accuracy,
      ...(Number.isFinite(input.odometerKm) ? { odometer_km: input.odometerKm } : {}),
      updated_at: timestamp,
    };
    const { data: existing, error: readError } = await client
      .from("driver_check_ins")
      .select("driver_id")
      .eq("driver_id", driverId)
      .eq("date", date)
      .maybeSingle();
    if (readError) throw readError;

    if (existing) {
      const { error } = await client.from("driver_check_ins").update(location).eq("driver_id", driverId).eq("date", date);
      if (error) throw error;
      return;
    }

    const { error } = await client.from("driver_check_ins").insert({
      driver_id: driverId,
      owner_id: ownerId,
      date,
      status: "pending",
      attempts: 0,
      created_at: timestamp,
      ...location,
    });
    if (error) throw error;
  },

  subscribeToOwnDriverCheckIns(date: string, onChange: (checkIns: DriverCheckIn[]) => void, onError: (error: unknown) => void) {
    const client = requireSupabase();
    const { ownerId } = resolveOwnerScope();

    const fetchAndEmit = async () => {
      const { data, error } = await client
        .from("driver_check_ins")
        .select("*")
        .eq("owner_id", ownerId)
        .eq("date", date);
      if (error) {
        onError(error);
        return;
      }
      onChange((data ?? []).map(mapCheckInRow));
    };

    void fetchAndEmit();

    // Unique per subscription instance -- a topic shared across
    // concurrent callers makes supabase-js return the same
    // already-subscribed channel object for the second caller, and
    // chaining .on(...) onto that throws (see orderRepository.ts).
    const channel = client
      .channel(`driver_check_ins:${ownerId}:${date}:${generateUuid()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_check_ins", filter: `owner_id=eq.${ownerId}` },
        () => void fetchAndEmit(),
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  },
};
