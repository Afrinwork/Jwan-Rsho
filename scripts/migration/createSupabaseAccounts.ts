// Stage 7: creates the real Supabase Auth accounts + profiles rows for
// the app's actual active users, mapped by their Firebase uid -> the
// new Supabase auth.users uuid. Does NOT send any password-setup email
// -- accounts are created with a random throwaway password; a separate,
// explicitly-approved step sends the real invite emails once this
// mapping has been reviewed.
//
// Usage: npx tsx scripts/migration/createSupabaseAccounts.ts
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

import type { Database } from "@/src/types/supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env).");
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  realtime: { transport: WebSocket as never },
});

// firebase_uid -> {email, fullName, role, managerEmail}. managerEmail is
// resolved to the manager's freshly-created uuid below, once every
// super_admin has been created first.
const REAL_USERS: { firebaseUid: string; email: string; fullName: string; role: "super_admin" | "admin"; managerEmail?: string }[] = [
  { firebaseUid: "5pUiKyVYKeOBVp9dweGuCkhMKTT2", email: "aa@gmail.com", fullName: "aa", role: "super_admin" },
  { firebaseUid: "s4GL8FmnwtXAnbkvW6z4C8t3e183", email: "rasho.juan95@gmail.com", fullName: "Juan Rsho", role: "super_admin" },
  { firebaseUid: "zeaIFxuzQFQWMHIbymKi4KYtofA2", email: "afrinwork18@gmail.com", fullName: "afrinwork18", role: "admin", managerEmail: "aa@gmail.com" },
  { firebaseUid: "2r2NO1ffY1MIpo3FxOY0LrGtqZM2", email: "rasho.juan99@gmail.com", fullName: "Juan Rsho", role: "admin", managerEmail: "aa@gmail.com" },
  { firebaseUid: "lZZjKiQCn2XC54UGIzLVUsSszda2", email: "mohammad.rasho1996@gmail.com", fullName: "Mohammad Rasho", role: "admin", managerEmail: "aa@gmail.com" },
  { firebaseUid: "zHatWeEMwzR7DooNtSprV84GxzD3", email: "alijan.alalii@gmail.com", fullName: "alijan.alalii", role: "admin", managerEmail: "aa@gmail.com" },
];

function randomThrowawayPassword() {
  return crypto.randomUUID() + crypto.randomUUID();
}

async function main() {
  const mapping: { firebaseUid: string; email: string; supabaseUuid: string }[] = [];

  // Pass 1: super_admins first, so admins can resolve managerEmail -> uuid.
  for (const user of REAL_USERS.filter((u) => u.role === "super_admin")) {
    const uuid = await createOne(user, null);
    mapping.push({ firebaseUid: user.firebaseUid, email: user.email, supabaseUuid: uuid });
  }

  for (const user of REAL_USERS.filter((u) => u.role === "admin")) {
    const managerUuid = mapping.find((m) => m.email === user.managerEmail)?.supabaseUuid;
    if (!managerUuid) throw new Error(`Manager ${user.managerEmail} for ${user.email} was not created in pass 1.`);
    const uuid = await createOne(user, managerUuid);
    mapping.push({ firebaseUid: user.firebaseUid, email: user.email, supabaseUuid: uuid });
  }

  const outPath = join(__dirname, "transformed", "uidMapping.json");
  writeFileSync(outPath, JSON.stringify(mapping, null, 2));
  console.log(`\nWrote ${mapping.length} mappings to ${outPath}`);
  console.table(mapping);
}

async function createOne(user: (typeof REAL_USERS)[number], managerId: string | null): Promise<string> {
  const { data: existing } = await supabase.from("profiles").select("id").eq("email", user.email).maybeSingle();
  if (existing) {
    console.log(`  ${user.email}: profile already exists (${existing.id}), skipping creation`);
    return existing.id;
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: user.email,
    password: randomThrowawayPassword(),
    email_confirm: true,
    user_metadata: { full_name: user.fullName },
  });
  if (createError || !created.user) {
    throw new Error(`Failed to create auth user for ${user.email}: ${createError?.message}`);
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: created.user.id,
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    manager_id: managerId,
    is_active: true,
  });
  if (profileError) {
    throw new Error(`Failed to insert profile for ${user.email}: ${profileError.message}`);
  }

  console.log(`  ${user.email}: created (${user.role}) -> ${created.user.id}`);
  return created.user.id;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
