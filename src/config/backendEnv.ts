// Which backend the repository switchers (src/repositories/*.ts, the
// non-.firebase/non-supabase/ ones) resolve to. Defaults to "firebase"
// so every existing build stays on the live backend unless explicitly
// opted into Supabase -- only a dedicated preview build (Stage 6 of the
// migration) sets EXPO_PUBLIC_BACKEND=supabase. Never flip the default;
// the production channel must never silently pick up "supabase" just
// because an env var was left unset.
export type Backend = "firebase" | "supabase";

export const backend: Backend = process.env.EXPO_PUBLIC_BACKEND === "supabase" ? "supabase" : "firebase";
