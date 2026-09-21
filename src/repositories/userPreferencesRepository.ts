import { backend } from "@/src/config/backendEnv";
import { userPreferencesRepository as firebaseImpl } from "@/src/repositories/userPreferencesRepository.firebase";
import { userPreferencesRepository as supabaseImpl } from "@/src/repositories/supabase/userPreferencesRepository";

export const userPreferencesRepository = backend === "supabase" ? supabaseImpl : firebaseImpl;
