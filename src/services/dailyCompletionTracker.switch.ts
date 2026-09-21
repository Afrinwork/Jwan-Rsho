import { backend } from "@/src/config/backendEnv";
import { dailyCompletionTracker as firebaseImpl } from "@/src/services/dailyCompletionTracker";
import { dailyCompletionTracker as supabaseImpl } from "@/src/services/supabase/dailyCompletionTracker";

export const dailyCompletionTracker = backend === "supabase" ? supabaseImpl : firebaseImpl;
