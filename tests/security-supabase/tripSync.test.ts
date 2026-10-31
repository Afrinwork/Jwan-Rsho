import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

import type { Database } from "@/src/types/supabase";
import type { SyncedActiveTrip } from "@/src/features/route/services/activeTripStorage.shared";

import { createTestUser } from "./testEnv";

// The map trip synced between phones signed in to the same account
// (route_orders.trip_state, add_customer_to_trip): each "phone" here is its
// own client with its own sign-in, like a second device.
const API_URL = "http://127.0.0.1:54321";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const PASSWORD = "test-password-1234";

async function signInSecondPhone(email: string) {
  const client: SupabaseClient<Database> = createClient(API_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: WebSocket as never },
  });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return client;
}

function startedTrip(userId: string, scopeIds: string[] | null): SyncedActiveTrip {
  return {
    userId,
    orderedIds: ["c1", "c2"],
    handledIds: [],
    skippedIds: [],
    scopeIds,
    started: true,
    savedAt: new Date().toISOString(),
    deviceId: "phone-a",
  };
}

async function writeTrip(client: SupabaseClient<Database>, userId: string, trip: SyncedActiveTrip) {
  const { error } = await client
    .from("route_orders")
    .upsert({ user_id: userId, updated_by: userId, updated_at: new Date().toISOString(), trip_state: trip as never });
  if (error) throw error;
}

async function readTrip(client: SupabaseClient<Database>, userId: string) {
  const { data, error } = await client.from("route_orders").select("trip_state").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return (data?.trip_state ?? null) as SyncedActiveTrip | null;
}

test("trip sync: a trip started on phone A is visible on phone B", async () => {
  const admin = await createTestUser("admin");
  const phoneB = await signInSecondPhone(admin.email);

  await writeTrip(admin.client, admin.id, startedTrip(admin.id, ["c1", "c2"]));

  const seen = await readTrip(phoneB, admin.id);
  assert.equal(seen?.started, true);
  assert.deepEqual(seen?.orderedIds, ["c1", "c2"]);
  assert.equal(seen?.deviceId, "phone-a");
});

test("trip sync: phone B gets phone A's change live (realtime)", async () => {
  const admin = await createTestUser("admin");
  const phoneB = await signInSecondPhone(admin.email);
  await phoneB.realtime.setAuth((await phoneB.auth.getSession()).data.session!.access_token);

  const received = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("no realtime event on phone B within 10s")), 10_000);
    const channel = phoneB
      .channel(`trip-sync-test:${admin.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "route_orders", filter: `user_id=eq.${admin.id}` }, () => {
        clearTimeout(timer);
        void phoneB.removeChannel(channel);
        resolve();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void writeTrip(admin.client, admin.id, startedTrip(admin.id, null));
      });
  });

  await received;
  assert.equal((await readTrip(phoneB, admin.id))?.started, true);
});

test("trip sync: 'add to trip' on phone B joins phone A's running trip", async () => {
  const admin = await createTestUser("admin");
  const phoneB = await signInSecondPhone(admin.email);
  const before = startedTrip(admin.id, ["c1", "c2"]);
  await writeTrip(admin.client, admin.id, before);

  const { error } = await phoneB.rpc("add_customer_to_trip", { p_customer_id: "new-customer" });
  assert.equal(error, null);

  const after = await readTrip(admin.client, admin.id);
  assert.deepEqual(after?.scopeIds, ["c1", "c2", "new-customer"]);
  assert.equal(after?.deviceId, "server");
  assert.notEqual(after?.savedAt, before.savedAt);
  // The rest of the trip is left as phone A wrote it.
  assert.deepEqual(after?.orderedIds, before.orderedIds);
  assert.equal(after?.started, true);
});

test("trip sync: adding the same customer twice keeps it once", async () => {
  const admin = await createTestUser("admin");
  await writeTrip(admin.client, admin.id, startedTrip(admin.id, ["c1"]));

  await admin.client.rpc("add_customer_to_trip", { p_customer_id: "c9" });
  await admin.client.rpc("add_customer_to_trip", { p_customer_id: "c9" });

  assert.deepEqual((await readTrip(admin.client, admin.id))?.scopeIds, ["c1", "c9"]);
});

test("trip sync: two phones adding at once both get in", async () => {
  const admin = await createTestUser("admin");
  const phoneB = await signInSecondPhone(admin.email);
  await writeTrip(admin.client, admin.id, startedTrip(admin.id, ["c1"]));

  await Promise.all([
    admin.client.rpc("add_customer_to_trip", { p_customer_id: "from-a" }),
    phoneB.rpc("add_customer_to_trip", { p_customer_id: "from-b" }),
  ]);

  const scope = (await readTrip(admin.client, admin.id))?.scopeIds ?? [];
  assert.deepEqual([...scope].sort(), ["c1", "from-a", "from-b"]);
});

test("trip sync: no addition to a trip that isn't started or covers every customer", async () => {
  const admin = await createTestUser("admin");
  const notStarted = { ...startedTrip(admin.id, ["c1"]), started: false };
  await writeTrip(admin.client, admin.id, notStarted);
  await admin.client.rpc("add_customer_to_trip", { p_customer_id: "c9" });
  assert.deepEqual((await readTrip(admin.client, admin.id))?.scopeIds, ["c1"]);

  const everyone = startedTrip(admin.id, null);
  await writeTrip(admin.client, admin.id, everyone);
  await admin.client.rpc("add_customer_to_trip", { p_customer_id: "c9" });
  assert.equal((await readTrip(admin.client, admin.id))?.scopeIds, null);
});

test("trip sync: another account can't see or add to the trip", async () => {
  const admin = await createTestUser("admin");
  const stranger = await createTestUser("admin");
  await writeTrip(admin.client, admin.id, startedTrip(admin.id, ["c1"]));

  assert.equal(await readTrip(stranger.client, admin.id), null);
  await stranger.client.rpc("add_customer_to_trip", { p_customer_id: "intruder" });
  assert.deepEqual((await readTrip(admin.client, admin.id))?.scopeIds, ["c1"]);
});
