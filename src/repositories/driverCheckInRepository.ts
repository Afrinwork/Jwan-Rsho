// Supabase is the only backend (Firebase -> Supabase migration complete);
// kept as a stable import path for the rest of the app.
export { driverCheckInRepository } from "@/src/repositories/supabase/driverCheckInRepository";
export type { CheckInAttemptFailureReason } from "@/src/repositories/supabase/driverCheckInRepository";
