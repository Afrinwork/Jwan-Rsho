import { backend } from "@/src/config/backendEnv";
import { routeOrderRepository as firebaseImpl } from "@/src/repositories/routeOrderRepository.firebase";
import { routeOrderRepository as supabaseImpl } from "@/src/repositories/supabase/routeOrderRepository";

export const routeOrderRepository = backend === "supabase" ? supabaseImpl : firebaseImpl;
