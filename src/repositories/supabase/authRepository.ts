import { requireSupabase } from "@/src/repositories/supabase/repositoryContext";
import { supabase } from "@/src/supabase/client";
import { AuthUser } from "@/src/types/authUser";

// Every method here lets the raw Supabase AuthError propagate (just
// `if (error) throw error`) instead of rewrapping it into a fixed
// AppError message -- rewrapping previously hid the real cause behind a
// generic "invalid credentials"/"something went wrong" text regardless
// of what actually failed. formatError() (src/utils/formatError.ts)
// already knows how to classify a raw Supabase AuthError via its
// authMessageMap, the same way it classifies FirebaseError/PostgrestError.
export const authRepository = {
  async login(email: string, password: string) {
    const { error } = await requireSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  async logout() {
    const client = requireSupabase();
    await client.auth.signOut();
  },

  async resetPassword(email: string) {
    const { error } = await requireSupabase().auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async updateEmail(nextEmail: string) {
    const { error } = await requireSupabase().auth.updateUser({ email: nextEmail.trim().toLowerCase() });
    if (error) throw error;
  },

  async updatePassword(nextPassword: string) {
    const { error } = await requireSupabase().auth.updateUser({ password: nextPassword });
    if (error) throw error;
  },

  // No Firebase-style "wait for getIdToken() first" step needed here --
  // supabase-js attaches the current session's access token to every
  // PostgREST/Realtime call from its own in-memory session state, so
  // there's no separate token-attachment race to guard against.
  observeAuth(callback: (user: AuthUser | null) => void) {
    if (!supabase) {
      callback(null);
      return () => undefined;
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (!user) {
        callback(null);
        return;
      }
      callback({
        uid: user.id,
        email: user.email ?? null,
        displayName: (user.user_metadata?.full_name as string | undefined) ?? null,
      });
    });

    return () => data.subscription.unsubscribe();
  },
};
