import { backend } from "@/src/config/backendEnv";
import { customerRepository as firebaseImpl } from "@/src/repositories/customerRepository.firebase";
import { customerRepository as supabaseImpl } from "@/src/repositories/supabase/customerRepository";

export const customerRepository = backend === "supabase" ? supabaseImpl : firebaseImpl;
