// Stage 7 (final step): imports the transformed rows from
// scripts/migration/transformed/ into the real Supabase project,
// remapping every Firebase-uid-shaped field (owner_id, manager_id,
// assigned_driver_id, driver_id, user_preferences.id) to the new
// Supabase auth uuid via uidMapping.json (see createSupabaseAccounts.ts
// -- must be run first).
//
// Usage: npx tsx scripts/migration/importToSupabase.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

import type { Database } from "@/src/types/supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  realtime: { transport: WebSocket as never },
});

const TRANSFORMED_DIR = join(__dirname, "transformed");

function readTransformed<T>(tableName: string): T[] {
  return JSON.parse(readFileSync(join(TRANSFORMED_DIR, `${tableName}.json`), "utf8"));
}

const UID_FIELDS = ["owner_id", "manager_id", "assigned_driver_id", "driver_id"] as const;

function remapUids(row: Record<string, unknown>, uidToUuid: Map<string, string>, skipped: Set<string>): Record<string, unknown> | null {
  const mapped: Record<string, unknown> = { ...row };
  for (const field of UID_FIELDS) {
    const value = mapped[field];
    if (value == null) continue;
    const uuid = uidToUuid.get(value as string);
    if (!uuid) {
      if (field === "owner_id") {
        skipped.add(`${JSON.stringify(row).slice(0, 80)}... (unmapped owner_id ${value})`);
        return null; // Row belongs to an owner we intentionally did not migrate -- skip it, don't guess.
      }
      mapped[field] = null; // assigned_driver_id/manager_id pointing at a non-migrated user: clear rather than fail the whole row.
      continue;
    }
    mapped[field] = uuid;
  }
  return mapped;
}

async function importTable(
  tableName: string,
  uidToUuid: Map<string, string>,
  idField = "id",
  extraFilter?: (row: Record<string, unknown>) => boolean,
): Promise<Set<string>> {
  const rows = readTransformed<Record<string, unknown>>(tableName);
  const skipped = new Set<string>();
  let remapped = rows.map((r) => remapUids(r, uidToUuid, skipped)).filter((r): r is Record<string, unknown> => r !== null);

  if (extraFilter) {
    const before = remapped.length;
    remapped = remapped.filter(extraFilter);
    const dropped = before - remapped.length;
    if (dropped > 0) {
      console.log(`  ${tableName}: skipping ${dropped} row(s) referencing a record that wasn't imported (pre-existing Firestore data issue)`);
    }
  }

  if (remapped.length === 0) {
    console.log(`  ${tableName}: 0 rows to import`);
    return new Set();
  }

  // Chunk to stay well under PostgREST's default request size limits.
  const chunkSize = 500;
  let imported = 0;
  for (let i = 0; i < remapped.length; i += chunkSize) {
    const chunk = remapped.slice(i, i + chunkSize);
    const { error } = await supabase.from(tableName as never).upsert(chunk as never, { onConflict: idField });
    if (error) throw new Error(`${tableName} import failed at offset ${i}: ${error.message}`);
    imported += chunk.length;
  }
  console.log(`  ${tableName}: ${imported}/${rows.length} rows imported${skipped.size ? ` (${skipped.size} skipped -- unmapped owner)` : ""}`);
  return new Set(remapped.map((r) => r[idField] as string));
}

async function main() {
  const mapping = JSON.parse(readFileSync(join(TRANSFORMED_DIR, "uidMapping.json"), "utf8")) as {
    firebaseUid: string;
    supabaseUuid: string;
  }[];
  const uidToUuid = new Map(mapping.map((m) => [m.firebaseUid, m.supabaseUuid]));
  console.log(`Loaded ${uidToUuid.size} uid mappings.\n`);

  const importedCustomerIds = await importTable("customers", uidToUuid);
  await importTable("products", uidToUuid);
  await importTable("countries", uidToUuid);
  await importTable("regions", uidToUuid);
  await importTable("cities", uidToUuid);
  const importedOrderIds = await importTable("orders", uidToUuid, "id", (r) => importedCustomerIds.has(r.customer_id as string));
  await importTable("order_items", uidToUuid, "id", (r) => importedOrderIds.has(r.order_id as string));

  // user_preferences.id IS the owner uuid -- remap the primary key itself.
  const prefRows = readTransformed<Record<string, unknown>>("user_preferences");
  const remappedPrefs: Record<string, unknown>[] = [];
  for (const r of prefRows) {
    const uuid = uidToUuid.get(r.id as string);
    if (uuid) remappedPrefs.push({ ...r, id: uuid });
  }
  if (remappedPrefs.length > 0) {
    const { error } = await supabase.from("user_preferences").upsert(remappedPrefs as never, { onConflict: "id" });
    if (error) throw new Error(`user_preferences import failed: ${error.message}`);
  }
  console.log(`  user_preferences: ${remappedPrefs.length}/${prefRows.length} rows imported`);

  console.log("\nImport finished.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
