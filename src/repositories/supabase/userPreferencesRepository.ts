import { requireCurrentUserId, requireSupabase } from "@/src/repositories/supabase/repositoryContext";
import { toCamelCase, toSnakeCase } from "@/src/repositories/supabase/caseMapping";
import { UserPreferences } from "@/src/types/userPreferences";

// user_preferences.id IS the owner's uuid (1:1, no separate owner_id
// column needed -- unlike Firestore, where ownerId was still stored as
// its own field even though the doc id already equalled it).
export const userPreferencesRepository = {
  async getPreferences() {
    const ownerId = requireCurrentUserId();
    const { data, error } = await requireSupabase().from("user_preferences").select("*").eq("id", ownerId).maybeSingle();
    if (error) throw error;
    return data ? { ...toCamelCase<UserPreferences>(data), ownerId: data.id } : null;
  },

  async savePreferences(input: Omit<UserPreferences, "id" | "createdAt" | "updatedAt">) {
    const ownerId = requireCurrentUserId();
    const timestamp = new Date().toISOString();
    const { ownerId: _ignoredOwnerId, ...preferences } = input;

    const { error } = await requireSupabase()
      .from("user_preferences")
      .upsert({
        ...toSnakeCase(preferences),
        id: ownerId,
        updated_at: timestamp,
      });
    if (error) throw error;
  },
};
