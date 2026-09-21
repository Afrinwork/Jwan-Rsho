import { backend } from "@/src/config/backendEnv";
import { driverCheckInRepository as firebaseImpl } from "@/src/repositories/driverCheckInRepository.firebase";
import { driverCheckInRepository as supabaseImpl } from "@/src/repositories/supabase/driverCheckInRepository";

export type { CheckInAttemptFailureReason } from "@/src/repositories/driverCheckInRepository.firebase";
export const driverCheckInRepository = backend === "supabase" ? supabaseImpl : firebaseImpl;
