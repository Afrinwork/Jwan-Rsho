// Which backend the repository switchers (src/repositories/*.ts, the
// non-.firebase/non-supabase/ ones) resolve to. Supabase is the live
// backend for every build now that the migration is complete; Firebase is
// only used when a build explicitly opts back in with
// EXPO_PUBLIC_BACKEND=firebase (emergency rollback), so an unset env var
// can never silently put a build back on the retired backend.
export type Backend = "firebase" | "supabase";

export const backend: Backend = process.env.EXPO_PUBLIC_BACKEND === "firebase" ? "firebase" : "supabase";
