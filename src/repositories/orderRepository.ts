import { backend } from "@/src/config/backendEnv";
import { orderRepository as firebaseImpl } from "@/src/repositories/orderRepository.firebase";
import { orderRepository as supabaseImpl } from "@/src/repositories/supabase/orderRepository";

export const orderRepository = backend === "supabase" ? supabaseImpl : firebaseImpl;
