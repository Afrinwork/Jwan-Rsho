import { backend } from "@/src/config/backendEnv";
import { accountDeletionService as firebaseImpl } from "@/src/features/settings/services/accountDeletionService.firebase";
import { accountDeletionService as supabaseImpl } from "@/src/features/settings/services/accountDeletionService.supabase";

export const accountDeletionService = backend === "supabase" ? supabaseImpl : firebaseImpl;
