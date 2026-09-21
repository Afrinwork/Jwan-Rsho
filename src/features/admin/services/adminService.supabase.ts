import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";
import { supabase } from "@/src/supabase/client";

type CreateUserInput = {
  email: string;
  fullName: string;
  password: string;
  role: "admin" | "driver";
};

// Replaces the Firebase httpsCallable pattern -- calls the matching
// supabase/functions/<name> Edge Function instead. None of this app's
// hooks inspect the resolved value's shape today (they only await/catch),
// so this doesn't need to mirror HttpsCallableResult's exact {data: T}
// wrapper -- just needs to throw on failure the same way.
async function invokeFunction<TResult>(name: string, body?: Record<string, unknown>): Promise<TResult> {
  if (!supabase) {
    throw new AppError(errorMessages.backendNotConfigured);
  }

  const { data, error } = await supabase.functions.invoke<TResult>(name, { body });
  if (error) throw error;
  return data as TResult;
}

export const adminService = {
  async createUser(input: CreateUserInput) {
    return invokeFunction<{ uid: string }>("create-user", input);
  },

  async deleteUser(email: string) {
    return invokeFunction<{ success: boolean }>("delete-user", { email });
  },

  async getActiveUserCount() {
    if (!supabase) {
      throw new AppError(errorMessages.backendNotConfigured);
    }

    const { data, error } = await supabase.rpc("get_active_user_count");
    if (error) throw error;
    return data as number;
  },

  async setUserActiveState(input: { email: string; isActive: boolean }) {
    return invokeFunction<{ success: boolean }>("set-user-active-state", input);
  },

  async updateManagedUser(input: { email: string; fullName?: string; newEmail?: string }) {
    return invokeFunction<{ success: boolean }>("update-managed-user", input);
  },
};
