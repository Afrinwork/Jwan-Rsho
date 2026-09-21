// One-off: sets a real password directly for each migrated account via
// the Admin API, bypassing the email-based recovery flow entirely
// (chosen because the project's built-in email sending is rate-limited
// and rejected one address outright -- see chat). The user distributes
// these passwords to each real person out of band (phone/WhatsApp), and
// each account can change it later via Settings once they're using the
// Supabase-backed app.
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { realtime: { transport: WebSocket as never } });

const NEW_PASSWORD = "Test1234!";
const EMAILS = [
  "aa@gmail.com",
  "rasho.juan95@gmail.com",
  "afrinwork18@gmail.com",
  "rasho.juan99@gmail.com",
  "mohammad.rasho1996@gmail.com",
  "alijan.alalii@gmail.com",
];

async function main() {
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (listError) throw listError;

  for (const email of EMAILS) {
    const user = list.users.find((u) => u.email === email);
    if (!user) {
      console.log(`  ${email}: NOT FOUND`);
      continue;
    }
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password: NEW_PASSWORD });
    console.log(error ? `  ${email}: FAILED -- ${error.message}` : `  ${email}: password set`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
