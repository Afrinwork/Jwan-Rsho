import { backend } from "@/src/config/backendEnv";
import { authRepository as firebaseImpl } from "@/src/repositories/authRepository.firebase";
import { authRepository as supabaseImpl } from "@/src/repositories/supabase/authRepository";

export const authRepository = backend === "supabase" ? supabaseImpl : firebaseImpl;
