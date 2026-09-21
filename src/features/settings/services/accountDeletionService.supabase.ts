import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";
import { supabase } from "@/src/supabase/client";

export const accountDeletionService = {
  async deleteOwnAccount() {
    if (!supabase) {
      throw new AppError(errorMessages.backendNotConfigured);
    }

    const { data, error } = await supabase.functions.invoke<{ success: boolean }>("delete-own-account");
    if (error) throw error;
    return data;
  },
};
