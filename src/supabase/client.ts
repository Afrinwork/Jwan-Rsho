import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabaseEnv } from "@/src/config/supabaseEnv";
import type { Database } from "@/src/types/supabase";

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// supabase-js needs to be told explicitly when the app goes to/from the
// background -- unlike the web, React Native has no visibility-change
// event wired in by default, and without this the auth token silently
// stops refreshing while backgrounded (documented supabase-js + RN
// requirement, no Firebase equivalent existed for this).
if (supabase) {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
