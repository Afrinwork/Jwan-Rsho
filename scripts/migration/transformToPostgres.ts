// Stage 3 (Trockenlauf): reads the JSON produced by exportFirestore.ts
// and reshapes it into the Postgres column names/types from
// supabase/migrations, applying the one-time legacy role normalization
// (replaces ever deploying migrateLegacyRoles to Supabase).
//
// UID fields (owner_id, manager_id, assigned_driver_id, driver_id,
// user_preferences.id) are left as the ORIGINAL Firebase uid strings
// here -- they get swapped for real Supabase auth.users UUIDs in Stage 7,
// once Auth accounts actually exist (see firebase_uid -> supabase_uuid
// mapping table in the migration plan). This script only validates
// shape, counts, and role normalization against a dry-run copy.
//
// Usage: npx tsx scripts/migration/transformToPostgres.ts
// (run exportFirestore.ts first)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeLegacyRole } from "./lib/normalizeLegacyRole";

const EXPORT_DIR = join(__dirname, "export");
const OUTPUT_DIR = join(__dirname, "transformed");

function readExported<T>(collectionName: string): T[] {
  const path = join(EXPORT_DIR, `${collectionName}.json`);
  if (!existsSync(path)) {
    throw new Error(`${path} not found -- run exportFirestore.ts first`);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeTransformed(tableName: string, rows: unknown[]) {
  writeFileSync(join(OUTPUT_DIR, `${tableName}.json`), JSON.stringify(rows, null, 2));
  console.log(`  ${tableName}: ${rows.length} rows`);
}

type FirestoreUser = {
  id: string;
  email: string;
  fullName?: string;
  // Seen once in the real export (K6IG7GYeUq486yVBS09R) -- a stray
  // lowercase variant from before camelCase was consistently enforced.
  fullname?: string;
  role?: string;
  managerId?: string | null;
  isActive?: boolean;
};

function transformProfiles() {
  const users = readExported<FirestoreUser>("users");
  const rows = users.map((u) => {
    const fullName = u.fullName ?? u.fullname;
    if (!fullName) {
      console.warn(`  WARNING: users/${u.id} has no fullName/fullname -- full_name is NOT NULL in Postgres, this row will fail to import as-is.`);
    }
    return {
      id: u.id, // Firebase uid placeholder -- remapped to a real auth uuid in Stage 7.
      email: u.email,
      full_name: fullName ?? null,
      role: normalizeLegacyRole(u.role, u.managerId),
      manager_id: u.managerId ?? null,
      is_active: u.isActive ?? true,
    };
  });

  const emailCounts = new Map<string, string[]>();
  for (const row of rows) {
    emailCounts.set(row.email, [...(emailCounts.get(row.email) ?? []), row.id]);
  }
  for (const [email, ids] of emailCounts) {
    if (ids.length > 1) {
      console.warn(`  WARNING: email "${email}" is shared by ${ids.length} user docs (${ids.join(", ")}) -- Supabase Auth requires unique emails, this must be resolved before Stage 7.`);
    }
  }

  writeTransformed("profiles", rows);
  return rows;
}

type FirestoreCustomer = Record<string, unknown> & { id: string };

function transformCustomers() {
  const customers = readExported<FirestoreCustomer>("customers");
  const rows = customers.map((c) => ({
    id: c.id,
    owner_id: c.ownerId,
    full_name: c.fullName,
    phone: c.phone ?? null,
    address: c.address ?? null,
    city: c.city ?? null,
    normalized_city: c.normalizedCity ?? null,
    country: c.country ?? null,
    region: c.region ?? null,
    latitude: c.latitude ?? null,
    longitude: c.longitude ?? null,
    location_status: c.locationStatus ?? null,
    note: c.note ?? null,
    assigned_driver_id: c.assignedDriverId ?? null,
    is_active: c.isActive ?? true,
    created_at: c.createdAt ?? null,
    updated_at: c.updatedAt ?? null,
  }));
  writeTransformed("customers", rows);
}

type FirestoreOrder = Record<string, unknown> & { id: string };

function transformOrders() {
  const orders = readExported<FirestoreOrder>("orders");
  const rows = orders.map((o) => ({
    id: o.id,
    owner_id: o.ownerId,
    customer_id: o.customerId,
    status: o.status,
    request_id: o.requestId ?? null,
    note: o.note ?? null,
    assigned_driver_id: o.assignedDriverId ?? null,
    ordered_at: o.orderedAt,
    completed_at: o.completedAt ?? null,
    created_at: o.createdAt ?? null,
    updated_at: o.updatedAt ?? null,
  }));
  writeTransformed("orders", rows);
}

type FirestoreOrderItem = Record<string, unknown> & { id: string; orderId: string };

function transformOrderItems() {
  const items = readExported<FirestoreOrderItem>("orderItems");
  // Deliberately drops the Firestore-only ownerId stamp (see schema notes
  // in supabase/migrations -- was a collectionGroup rule-scoping hack,
  // not needed once RLS can join through orders directly).
  const rows = items.map((i) => ({
    id: i.id,
    order_id: i.orderId,
    product_id: i.productId ?? null,
    product_name_snapshot: i.productNameSnapshot,
    quantity: i.quantity,
    unit: i.unit,
    sort_order: i.sortOrder ?? 0,
  }));
  writeTransformed("order_items", rows);
}

type CatalogDoc = Record<string, unknown> & { id: string };

function transformCatalog(collectionName: string, tableName: string, extra: (d: CatalogDoc) => Record<string, unknown>) {
  const docs = readExported<CatalogDoc>(collectionName);
  const rows = docs.map((d) => ({
    id: d.id,
    owner_id: d.ownerId,
    name: d.name,
    name_ar: d.nameAr ?? null,
    normalized_name: d.normalizedName,
    is_active: d.isActive ?? true,
    created_at: d.createdAt ?? null,
    updated_at: d.updatedAt ?? null,
    ...extra(d),
  }));
  writeTransformed(tableName, rows);
}

function transformUserPreferences() {
  const docs = readExported<Record<string, unknown> & { id: string }>("userPreferences");
  const rows = docs.map((d) => ({
    id: d.ownerId, // doc id === ownerId in Firestore already
    theme_mode: d.themeMode ?? null,
    language: d.language ?? null,
    preferred_navigation_app: d.preferredNavigationApp ?? null,
    shop_name: d.shopName ?? null,
    share_include_address: d.shareIncludeAddress ?? true,
    share_include_phone: d.shareIncludePhone ?? true,
    share_include_totals: d.shareIncludeTotals ?? true,
    created_at: d.createdAt ?? null,
    updated_at: d.updatedAt ?? null,
  }));
  writeTransformed("user_preferences", rows);
}

function transformDriverCompletionStats() {
  const docs = readExported<Record<string, unknown> & { id: string }>("driverCompletionStats");
  const rows = docs.map((d) => ({
    driver_id: d.driverId,
    owner_id: d.ownerId,
    date: d.date,
    count: d.count ?? 0,
    updated_at: d.updatedAt ?? null,
  }));
  writeTransformed("driver_completion_stats", rows);
}

function transformDriverCheckIns() {
  const docs = readExported<Record<string, unknown> & { id: string }>("driverCheckIns");
  const rows = docs.map((d) => ({
    driver_id: d.driverId,
    date: d.date,
    owner_id: d.ownerId,
    status: d.status,
    blocked_reason: d.blockedReason ?? null,
    attempts: d.attempts ?? 0,
    address: d.address ?? null,
    latitude: d.latitude ?? null,
    longitude: d.longitude ?? null,
    gps_accuracy: d.gpsAccuracy ?? null,
    odometer_km: d.odometerKm ?? null,
    photo_storage_path: d.photoStoragePath ?? null,
    completed_at: d.completedAt ?? null,
    created_at: d.createdAt ?? null,
    updated_at: d.updatedAt ?? null,
  }));
  writeTransformed("driver_check_ins", rows);
}

function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Transforming export -> ${OUTPUT_DIR}\n`);

  const profiles = transformProfiles();
  transformCustomers();
  transformOrders();
  transformOrderItems();
  transformCatalog("products", "products", (d) => ({
    default_unit: d.defaultUnit,
    emoji: d.emoji ?? null,
    sort_order: d.sortOrder ?? 0,
  }));
  transformCatalog("countries", "countries", (d) => ({
    iso_code: d.isoCode ?? null,
    sort_order: d.sortOrder ?? 0,
  }));
  transformCatalog("regions", "regions", (d) => ({
    country: d.country ?? null,
    normalized_country: d.normalizedCountry ?? null,
    city: d.city ?? null,
    normalized_city: d.normalizedCity ?? null,
  }));
  transformCatalog("cities", "cities", (d) => ({
    sort_order: d.sortOrder ?? 0,
  }));
  transformUserPreferences();
  transformDriverCompletionStats();
  transformDriverCheckIns();

  const roleCounts = profiles.reduce<Record<string, number>>((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1;
    return acc;
  }, {});
  console.log("\nNormalized role counts:", roleCounts);
  console.log(
    "\nNOTE: owner_id/manager_id/assigned_driver_id/driver_id/user_preferences.id " +
      "still hold Firebase uid strings -- these get remapped to real Supabase " +
      "auth.users UUIDs in Stage 7, after real Auth accounts are created.",
  );
}

main();
