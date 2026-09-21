// Stage 3 (Trockenlauf): exports every Firestore collection this app
// uses into local JSON files, read-only against production. Safe to run
// as many times as needed -- never writes back to Firestore.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
//     npx tsx scripts/migration/exportFirestore.ts
//
// Output lands in scripts/migration/export/*.json (gitignored -- this is
// a full data dump, must never be committed).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getFirestoreAdmin } from "./lib/firebaseAdmin";

const OUTPUT_DIR = join(__dirname, "export");

const TOP_LEVEL_COLLECTIONS = [
  "users",
  "customers",
  "orders",
  "products",
  "countries",
  "regions",
  "cities",
  "userPreferences",
  "driverCompletionStats",
  "driverCheckIns",
] as const;

async function exportCollection(collectionName: string) {
  const db = getFirestoreAdmin();
  const snapshot = await db.collection(collectionName).get();
  const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  writeFileSync(join(OUTPUT_DIR, `${collectionName}.json`), JSON.stringify(docs, null, 2));
  console.log(`  ${collectionName}: ${docs.length} docs`);
  return docs;
}

async function exportOrderItems(orderIds: string[]) {
  const db = getFirestoreAdmin();
  const allItems: Record<string, unknown>[] = [];
  for (const orderId of orderIds) {
    const snapshot = await db.collection("orders").doc(orderId).collection("items").get();
    for (const doc of snapshot.docs) {
      allItems.push({ id: doc.id, orderId, ...doc.data() });
    }
  }
  writeFileSync(join(OUTPUT_DIR, "orderItems.json"), JSON.stringify(allItems, null, 2));
  console.log(`  orderItems: ${allItems.length} docs across ${orderIds.length} orders`);
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Exporting Firestore collections to ${OUTPUT_DIR}\n`);

  let orderIds: string[] = [];
  for (const collectionName of TOP_LEVEL_COLLECTIONS) {
    const docs = await exportCollection(collectionName);
    if (collectionName === "orders") {
      orderIds = docs.map((d) => d.id as string);
    }
  }

  await exportOrderItems(orderIds);
  console.log("\nExport finished.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
