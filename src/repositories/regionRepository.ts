import { backend } from "@/src/config/backendEnv";
import { regionRepository as firebaseImpl } from "@/src/repositories/regionRepository.firebase";
import { regionRepository as supabaseImpl } from "@/src/repositories/supabase/regionRepository";

export const regionRepository = backend === "supabase" ? supabaseImpl : firebaseImpl;
