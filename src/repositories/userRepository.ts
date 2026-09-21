import { backend } from "@/src/config/backendEnv";
import { userRepository as firebaseImpl } from "@/src/repositories/userRepository.firebase";
import { userRepository as supabaseImpl } from "@/src/repositories/supabase/userRepository";

export const userRepository = backend === "supabase" ? supabaseImpl : firebaseImpl;
