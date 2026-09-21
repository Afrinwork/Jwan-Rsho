import { backend } from "@/src/config/backendEnv";
import { productRepository as firebaseImpl } from "@/src/repositories/productRepository.firebase";
import { productRepository as supabaseImpl } from "@/src/repositories/supabase/productRepository";

export const productRepository = backend === "supabase" ? supabaseImpl : firebaseImpl;
