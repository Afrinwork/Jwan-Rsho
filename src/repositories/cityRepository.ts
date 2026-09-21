import { backend } from "@/src/config/backendEnv";
import { cityRepository as firebaseImpl } from "@/src/repositories/cityRepository.firebase";
import { cityRepository as supabaseImpl } from "@/src/repositories/supabase/cityRepository";

export const cityRepository = backend === "supabase" ? supabaseImpl : firebaseImpl;
