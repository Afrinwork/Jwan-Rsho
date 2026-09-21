import { backend } from "@/src/config/backendEnv";
import { countryRepository as firebaseImpl } from "@/src/repositories/countryRepository.firebase";
import { countryRepository as supabaseImpl } from "@/src/repositories/supabase/countryRepository";

export const countryRepository = backend === "supabase" ? supabaseImpl : firebaseImpl;
