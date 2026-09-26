// Supabase is the only backend (Firebase -> Supabase migration complete);
// kept as a stable import path for the rest of the app.
export { driverStatsRepository, todayKey } from "@/src/repositories/supabase/driverStatsRepository";
export type { DriverCompletionStat } from "@/src/repositories/supabase/driverStatsRepository";
