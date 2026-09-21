import { backend } from "@/src/config/backendEnv";
import { adminService as firebaseImpl } from "@/src/features/admin/services/adminService.firebase";
import { adminService as supabaseImpl } from "@/src/features/admin/services/adminService.supabase";

export const adminService = backend === "supabase" ? supabaseImpl : firebaseImpl;
