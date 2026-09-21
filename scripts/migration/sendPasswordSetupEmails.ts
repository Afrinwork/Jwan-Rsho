// Stage 7 (final step, explicitly approved separately from account
// creation): sends a real "set your password" email to every migrated
// real user, via Supabase Auth's standard password-recovery flow --
// these accounts exist already (created with a random throwaway
// password nobody knows), so recovery is the correct flow to let them
// set their own.
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error("EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set.");
}

// The anon key is enough here -- resetPasswordForEmail is a public,
// unauthenticated endpoint (same one the app's own "forgot password"
// screen will call), no service role needed.
const supabase = createClient(SUPABASE_URL, ANON_KEY, { realtime: { transport: WebSocket as never } });

const EMAILS = [
  "aa@gmail.com",
  "rasho.juan95@gmail.com",
  "afrinwork18@gmail.com",
  "rasho.juan99@gmail.com",
  "mohammad.rasho1996@gmail.com",
  "alijan.alalii@gmail.com",
];

async function main() {
  for (const email of EMAILS) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      console.log(`  ${email}: FAILED -- ${error.message}`);
    } else {
      console.log(`  ${email}: sent`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
