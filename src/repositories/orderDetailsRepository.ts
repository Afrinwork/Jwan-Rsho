import { backend } from "@/src/config/backendEnv";
import { orderDetailsRepository as firebaseImpl } from "@/src/repositories/orderDetailsRepository.firebase";
import { orderDetailsRepository as supabaseImpl } from "@/src/repositories/supabase/orderDetailsRepository";

export const orderDetailsRepository = backend === "supabase" ? supabaseImpl : firebaseImpl;
