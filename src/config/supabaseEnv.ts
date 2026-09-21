const env = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export const isSupabaseConfigured = Object.values(env).every(Boolean);
export const supabaseEnv = env;
