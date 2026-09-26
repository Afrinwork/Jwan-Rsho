// One-off catch-up after the Firebase -> Supabase cutover: copies the open
// orders that were entered in the OLD (Firebase) app after the 22.09 export
// and whose customer doesn't exist in Supabase yet (not by id, not by phone
// number). Everything else is skipped on purpose:
//   - orders that were in the export but are gone from Supabase were deleted
//     or completed there deliberately,
//   - orders whose customer already exists were re-entered in the new app.
// Runs in ONE transaction: on any error nothing is written.
//
// Run from the project root (needs SUPABASE_DB_PASSWORD in .env):
//   node scripts/migration/importMissingFirebaseOrders.cjs            (dry run: only lists)
//   node scripts/migration/importMissingFirebaseOrders.cjs --write    (actually imports)

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

const { initializeApp, cert } = require(path.join(root, "functions/node_modules/firebase-admin/lib/app"));
const { getFirestore } = require(path.join(root, "functions/node_modules/firebase-admin/lib/firestore"));
const { Client } = require(path.join(root, "node_modules/pg"));

const write = process.argv.includes("--write");
const serviceAccount = fs.readdirSync(root).find((name) => name.includes("firebase-adminsdk") && name.endsWith(".json"));
initializeApp({ credential: cert(require(path.join(root, serviceAccount))) });
const ref = require(path.join(root, "supabase/.temp/linked-project.json")).ref;
const transformed = path.join(root, "scripts/migration/transformed");
const uidMap = new Map(JSON.parse(fs.readFileSync(path.join(transformed, "uidMapping.json"), "utf8")).map((m) => [m.firebaseUid, m.supabaseUuid]));
const exported = new Set(JSON.parse(fs.readFileSync(path.join(transformed, "orders.json"), "utf8")).map((o) => o.id));
const iso = (v) => (v == null ? null : typeof v === "string" ? v : v.toDate ? v.toDate().toISOString() : null);
const phoneKey = (p) => String(p ?? "").replace(/\D/g, "").slice(-8);

(async () => {
  const db = getFirestore();
  const pg = new Client({ host: `db.${ref}.supabase.co`, port: 5432, user: "postgres", database: "postgres", password: process.env.SUPABASE_DB_PASSWORD, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  const sbOrders = new Set((await pg.query("select id from orders")).rows.map((r) => r.id));
  const sbCustIds = new Set((await pg.query("select id from customers")).rows.map((r) => r.id));
  const sbProducts = new Set((await pg.query("select id from products")).rows.map((r) => r.id));
  const sbPhones = new Set((await pg.query("select phone from customers")).rows.map((r) => phoneKey(r.phone)).filter((k) => k.length >= 6));

  const candidates = (await db.collection("orders").get()).docs.filter((d) => !sbOrders.has(d.id) && !exported.has(d.id));
  const toImport = [];
  for (const d of candidates) {
    const o = d.data();
    const cSnap = await db.collection("customers").doc(o.customerId).get();
    const c = cSnap.data();
    if (!c || sbCustIds.has(o.customerId) || sbPhones.has(phoneKey(c.phone))) continue;
    const items = (await d.ref.collection("items").get()).docs;
    toImport.push({ d, o, cSnap, c, items });
    console.log(`- ${c.fullName} | ${o.createdAt?.slice(0, 16)} | ${items.map((i) => `${i.data().productNameSnapshot} x${i.data().quantity}`).join(", ")}`);
  }
  console.log(`${toImport.length} Bestellung(en) fehlen in Supabase.`);

  if (!write) {
    console.log("Probelauf – nichts gespeichert. Zum Übertragen mit --write erneut starten.");
    await pg.end();
    process.exit(0);
  }

  await pg.query("begin");
  try {
    for (const { d, o, cSnap, c, items } of toImport) {
      const owner = uidMap.get(o.ownerId);
      if (!owner) throw new Error("Kein Supabase-Konto für " + o.ownerId);
      await pg.query(
        `insert into customers (id, owner_id, full_name, phone, address, city, normalized_city, country, region, latitude, longitude, location_status, note, assigned_driver_id, is_active, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,null,$14,$15,$16)`,
        [cSnap.id, owner, c.fullName, c.phone ?? null, c.address ?? null, c.city ?? null, c.normalizedCity ?? (c.city ?? "").trim().toLowerCase(), c.country ?? null, c.region ?? null,
         c.latitude ?? null, c.longitude ?? null, c.locationStatus ?? null, c.note ?? null, c.isActive !== false, iso(c.createdAt) ?? iso(o.createdAt), iso(c.updatedAt) ?? iso(o.createdAt)],
      );
      await pg.query(
        `insert into orders (id, owner_id, customer_id, status, request_id, note, assigned_driver_id, ordered_at, completed_at, created_at, updated_at, hidden_from_driver)
         values ($1,$2,$3,$4,$5,$6,null,$7,$8,$9,$10,false)`,
        [d.id, owner, cSnap.id, o.status, o.requestId ?? null, o.note ?? null, iso(o.orderedAt) ?? iso(o.createdAt), iso(o.completedAt), iso(o.createdAt), iso(o.updatedAt) ?? iso(o.createdAt)],
      );
      for (const it of items) {
        const i = it.data();
        await pg.query(
          `insert into order_items (id, order_id, product_id, product_name_snapshot, quantity, unit, sort_order) values ($1,$2,$3,$4,$5,$6,$7)`,
          [it.id, d.id, sbProducts.has(i.productId) ? i.productId : null, i.productNameSnapshot, i.quantity, i.unit, i.sortOrder ?? 0],
        );
      }
    }
    await pg.query("commit");
    console.log(`FERTIG: ${toImport.length} Bestellungen mit Kunden und Positionen übertragen.`);
  } catch (error) {
    await pg.query("rollback");
    console.log("FEHLER, nichts gespeichert:", error.message);
  }
  await pg.end();
  process.exit(0);
})().catch((error) => {
  console.log("FEHLER:", error.message);
  process.exit(1);
});
