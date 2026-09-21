import { backend } from "@/src/config/backendEnv";
import { driverStatsRepository as firebaseImpl, todayKey as firebaseTodayKey } from "@/src/repositories/driverStatsRepository.firebase";
import { driverStatsRepository as supabaseImpl, todayKey as supabaseTodayKey } from "@/src/repositories/supabase/driverStatsRepository";

export type { DriverCompletionStat } from "@/src/repositories/driverStatsRepository.firebase";
export const driverStatsRepository = backend === "supabase" ? supabaseImpl : firebaseImpl;
export const todayKey = backend === "supabase" ? supabaseTodayKey : firebaseTodayKey;
