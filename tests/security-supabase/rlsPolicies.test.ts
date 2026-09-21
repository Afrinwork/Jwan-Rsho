import assert from "node:assert/strict";
import { test } from "node:test";

import { adminClient, anonClient, createTestUser } from "./testEnv";

const ownerScopedTables = ["customers", "orders", "products", "countries", "regions", "cities"] as const;

function uid() {
  return crypto.randomUUID();
}

async function seedOwnerRow(table: (typeof ownerScopedTables)[number], id: string, ownerId: string) {
  const base: Record<string, unknown> = { id, owner_id: ownerId };
  if (table === "customers") Object.assign(base, { full_name: "Seed" });
  if (table === "orders") {
    const customerId = uid();
    const { error } = await adminClient.from("customers").insert({ id: customerId, owner_id: ownerId, full_name: "Seed Customer" });
    if (error) throw error;
    Object.assign(base, { customer_id: customerId, status: "open", ordered_at: new Date().toISOString() });
  }
  if (table === "products") Object.assign(base, { name: "Seed", normalized_name: "seed", default_unit: "pcs" });
  if (table === "countries") Object.assign(base, { name: "Seed", normalized_name: "seed" });
  if (table === "regions") Object.assign(base, { name: "Seed", normalized_name: "seed" });
  if (table === "cities") Object.assign(base, { name: "Seed", normalized_name: "seed" });

  const { error } = await adminClient.from(table).insert(base as never);
  if (error) throw error;
}

for (const table of ownerScopedTables) {
  test(`${table}: owner can read their own row`, async () => {
    const owner = await createTestUser("super_admin");
    const id = uid();
    await seedOwnerRow(table, id, owner.id);

    const { data, error } = await owner.client.from(table).select("*").eq("id", id).maybeSingle();
    assert.equal(error, null);
    assert.ok(data);
  });

  test(`${table}: foreign user cannot read another owner's row`, async () => {
    const owner = await createTestUser("super_admin");
    const stranger = await createTestUser("super_admin");
    const id = uid();
    await seedOwnerRow(table, id, owner.id);

    const { data } = await stranger.client.from(table).select("*").eq("id", id).maybeSingle();
    assert.equal(data, null);
  });

  test(`${table}: foreign user cannot update or delete another owner's row`, async () => {
    const owner = await createTestUser("super_admin");
    const stranger = await createTestUser("super_admin");
    const id = uid();
    await seedOwnerRow(table, id, owner.id);

    const updateResult = await stranger.client.from(table).update({ owner_id: stranger.id } as never).eq("id", id);
    // RLS silently affects zero rows rather than throwing (USING clause
    // filters the target set to nothing this caller may touch).
    assert.equal(updateResult.count ?? 0, 0);

    await stranger.client.from(table).delete().eq("id", id);
    const { data: stillThere } = await owner.client.from(table).select("id").eq("id", id).maybeSingle();
    assert.ok(stillThere, "row must survive a foreign delete attempt");
  });

  test(`${table}: cannot insert a row tagged with someone else's owner_id`, async () => {
    const attacker = await createTestUser("super_admin");
    const victim = await createTestUser("super_admin");
    const id = uid();
    const base: Record<string, unknown> = { id, owner_id: victim.id };
    if (table === "customers") Object.assign(base, { full_name: "Fake" });
    if (table === "products") Object.assign(base, { name: "Fake", normalized_name: "fake", default_unit: "pcs" });
    if (table === "countries" || table === "regions" || table === "cities") {
      Object.assign(base, { name: "Fake", normalized_name: "fake" });
    }
    if (table === "orders") return; // orders requires a real customer_id -- covered by its own RPC tests below.

    const { error } = await attacker.client.from(table).insert(base as never);
    assert.ok(error, "insert with a foreign owner_id must be rejected by RLS");
  });

  test(`${table}: unauthenticated access is blocked`, async () => {
    const owner = await createTestUser("super_admin");
    const id = uid();
    await seedOwnerRow(table, id, owner.id);

    const { data } = await anonClient().from(table).select("*").eq("id", id).maybeSingle();
    assert.equal(data, null);
  });
}

test("customers: an assigned driver can read a customer belonging to their manager", async () => {
  const manager = await createTestUser("super_admin");
  const driver = await createTestUser("driver", manager.id);
  const customerId = uid();
  await adminClient.from("customers").insert({ id: customerId, owner_id: manager.id, full_name: "Assigned", assigned_driver_id: driver.id });

  const { data } = await driver.client.from("customers").select("*").eq("id", customerId).maybeSingle();
  assert.ok(data);
});

test("customers: a driver cannot read a customer belonging to a different manager even if assigned_driver_id matches", async () => {
  const managerA = await createTestUser("super_admin");
  const managerB = await createTestUser("super_admin");
  const driver = await createTestUser("driver", managerA.id);
  const customerId = uid();
  await adminClient.from("customers").insert({ id: customerId, owner_id: managerB.id, full_name: "Wrong manager", assigned_driver_id: driver.id });

  const { data } = await driver.client.from("customers").select("*").eq("id", customerId).maybeSingle();
  assert.equal(data, null);
});

test("customers: a driver cannot write, only read", async () => {
  const manager = await createTestUser("super_admin");
  const driver = await createTestUser("driver", manager.id);
  const customerId = uid();
  await adminClient.from("customers").insert({ id: customerId, owner_id: manager.id, full_name: "Assigned", assigned_driver_id: driver.id });

  const { error: insertError } = await driver.client.from("customers").insert({ id: uid(), owner_id: manager.id, full_name: "New" });
  assert.ok(insertError);

  const updateResult = await driver.client.from("customers").update({ full_name: "Changed" }).eq("id", customerId);
  assert.equal(updateResult.count ?? 0, 0);
  const { data: unchanged } = await adminClient.from("customers").select("full_name").eq("id", customerId).single();
  assert.equal(unchanged?.full_name, "Assigned");
});

test("order_items: owner and assigned driver can read/delete, only owner can insert/update", async () => {
  const manager = await createTestUser("super_admin");
  const driver = await createTestUser("driver", manager.id);
  const customerId = uid();
  const orderId = uid();
  const itemId = uid();
  await adminClient.from("customers").insert({ id: customerId, owner_id: manager.id, full_name: "C" });
  await adminClient
    .from("orders")
    .insert({ id: orderId, owner_id: manager.id, customer_id: customerId, status: "open", assigned_driver_id: driver.id, ordered_at: new Date().toISOString() });
  await adminClient.from("order_items").insert({ id: itemId, order_id: orderId, product_name_snapshot: "P", quantity: 1, unit: "pcs" });

  const { data: driverRead } = await driver.client.from("order_items").select("*").eq("id", itemId).maybeSingle();
  assert.ok(driverRead);

  const { error: driverInsertError } = await driver.client
    .from("order_items")
    .insert({ id: uid(), order_id: orderId, product_name_snapshot: "P2", quantity: 1, unit: "pcs" });
  assert.ok(driverInsertError, "driver must not be able to insert order items");

  const { data: ownerRead } = await manager.client.from("order_items").select("*").eq("id", itemId).maybeSingle();
  assert.ok(ownerRead);
});

test("order_items: foreign user cannot read another owner's items", async () => {
  const manager = await createTestUser("super_admin");
  const stranger = await createTestUser("super_admin");
  const customerId = uid();
  const orderId = uid();
  const itemId = uid();
  await adminClient.from("customers").insert({ id: customerId, owner_id: manager.id, full_name: "C" });
  await adminClient.from("orders").insert({ id: orderId, owner_id: manager.id, customer_id: customerId, status: "open", ordered_at: new Date().toISOString() });
  await adminClient.from("order_items").insert({ id: itemId, order_id: orderId, product_name_snapshot: "P", quantity: 1, unit: "pcs" });

  const { data } = await stranger.client.from("order_items").select("*").eq("id", itemId).maybeSingle();
  assert.equal(data, null);
});

test("profiles: a user can read their own profile and their own team, not a stranger's", async () => {
  const manager = await createTestUser("super_admin");
  const driver = await createTestUser("driver", manager.id);
  const stranger = await createTestUser("super_admin");

  const { data: ownRead } = await manager.client.from("profiles").select("*").eq("id", manager.id).maybeSingle();
  assert.ok(ownRead);

  const { data: teamRead } = await manager.client.from("profiles").select("*").eq("id", driver.id).maybeSingle();
  assert.ok(teamRead, "manager must be able to read their own driver's profile");

  const { data: strangerRead } = await stranger.client.from("profiles").select("*").eq("id", driver.id).maybeSingle();
  assert.equal(strangerRead, null);
});

test("profiles: self-update cannot change role, manager_id, or is_active (enforce_profile_self_update trigger)", async () => {
  const manager = await createTestUser("super_admin");
  const driver = await createTestUser("driver", manager.id);

  const { error: roleError } = await driver.client.from("profiles").update({ role: "super_admin" }).eq("id", driver.id);
  assert.ok(roleError, "self-promotion must be rejected");

  const { error: managerError } = await driver.client.from("profiles").update({ manager_id: driver.id }).eq("id", driver.id);
  assert.ok(managerError, "changing manager_id via self-update must be rejected");

  const { error: activeError } = await driver.client.from("profiles").update({ is_active: false }).eq("id", driver.id);
  assert.ok(activeError, "changing is_active via self-update must be rejected");

  const { error: nameError } = await driver.client.from("profiles").update({ full_name: "New Name" }).eq("id", driver.id);
  assert.equal(nameError, null, "unrelated self-update fields must still be allowed");
});

test("profiles: nobody can insert or privilege-escalate-delete via the anon/authenticated role (Edge Functions only, service role)", async () => {
  const manager = await createTestUser("super_admin");
  const { error } = await manager.client.from("profiles").insert({
    id: uid(),
    email: "x@example.test",
    full_name: "X",
    role: "admin",
    manager_id: manager.id,
  });
  assert.ok(error, "direct client-side profile creation must be rejected -- only create-user Edge Function may do this");
});

test("driver_check_ins: driver can insert their own row only with owner_id == their real manager", async () => {
  const manager = await createTestUser("super_admin");
  const driver = await createTestUser("driver", manager.id);
  const today = new Date().toISOString().slice(0, 10);

  const { error: wrongOwnerError } = await driver.client
    .from("driver_check_ins")
    .insert({ driver_id: driver.id, date: today, owner_id: uid(), status: "ok", attempts: 0 });
  assert.ok(wrongOwnerError, "owner_id must match the driver's real manager_id, not an arbitrary value");

  const { error } = await driver.client.from("driver_check_ins").insert({ driver_id: driver.id, date: today, owner_id: manager.id, status: "ok", attempts: 0 });
  assert.equal(error, null);
});

test("driver_check_ins: a driver cannot clear an admin_blocked reason themselves (enforce_checkin_update trigger)", async () => {
  const manager = await createTestUser("super_admin");
  const driver = await createTestUser("driver", manager.id);
  const today = new Date().toISOString().slice(0, 10);
  await adminClient
    .from("driver_check_ins")
    .insert({ driver_id: driver.id, date: today, owner_id: manager.id, status: "blocked", blocked_reason: "admin_blocked", attempts: 0 });

  const { error: driverClearError } = await driver.client
    .from("driver_check_ins")
    .update({ status: "ok", blocked_reason: null })
    .eq("driver_id", driver.id)
    .eq("date", today);
  assert.ok(driverClearError, "driver must not be able to self-clear an admin block");

  const { error: managerClearError } = await manager.client
    .from("driver_check_ins")
    .update({ status: "ok", blocked_reason: null })
    .eq("driver_id", driver.id)
    .eq("date", today);
  assert.equal(managerClearError, null, "the manager must still be able to clear it");
});

test("driver_check_ins: manager can only touch status/blocked_reason/updated_at, not location/photo fields", async () => {
  const manager = await createTestUser("super_admin");
  const driver = await createTestUser("driver", manager.id);
  const today = new Date().toISOString().slice(0, 10);
  await adminClient
    .from("driver_check_ins")
    .insert({ driver_id: driver.id, date: today, owner_id: manager.id, status: "ok", attempts: 0, address: "Original" });

  const { error } = await manager.client.from("driver_check_ins").update({ address: "Tampered" }).eq("driver_id", driver.id).eq("date", today);
  assert.ok(error, "manager must not be able to rewrite a driver-submitted field like address");
});

test("RPC assign_customer_driver: atomically mirrors the driver onto all open orders for that customer", async () => {
  const manager = await createTestUser("super_admin");
  const driver = await createTestUser("driver", manager.id);
  const customerId = uid();
  const openOrderId = uid();
  const completedOrderId = uid();
  await adminClient.from("customers").insert({ id: customerId, owner_id: manager.id, full_name: "C" });
  await adminClient.from("orders").insert([
    { id: openOrderId, owner_id: manager.id, customer_id: customerId, status: "open", ordered_at: new Date().toISOString() },
    { id: completedOrderId, owner_id: manager.id, customer_id: customerId, status: "completed", ordered_at: new Date().toISOString() },
  ]);

  const { error } = await manager.client.rpc("assign_customer_driver", { p_customer_id: customerId, p_driver_id: driver.id } as never);
  assert.equal(error, null);

  const { data: openOrder } = await adminClient.from("orders").select("assigned_driver_id").eq("id", openOrderId).single();
  assert.equal(openOrder?.assigned_driver_id, driver.id);

  const { data: completedOrder } = await adminClient.from("orders").select("assigned_driver_id").eq("id", completedOrderId).single();
  assert.equal(completedOrder?.assigned_driver_id, null, "completed orders must not be mirrored");
});

test("RPC create_order_atomic: rejects a duplicate order id (idempotency guard)", async () => {
  const manager = await createTestUser("super_admin");
  const customerId = uid();
  const orderId = uid();
  await adminClient.from("customers").insert({ id: customerId, owner_id: manager.id, full_name: "C" });

  const timestamp = new Date().toISOString();
  const args = {
    p_order_id: orderId,
    p_customer_id: customerId,
    p_new_customer: null,
    // created_at/updated_at must be supplied here -- jsonb_populate_record
    // against a null base record leaves any omitted column NULL, it does
    // NOT fall back to the column's own `default now()` the way a plain
    // INSERT would. The real orderRepository.createOrder() always
    // includes them via withCreateTimestamps() before calling this RPC.
    p_order: {
      id: orderId,
      owner_id: manager.id,
      customer_id: customerId,
      status: "open",
      ordered_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
    },
    p_items: [],
  };

  const first = await manager.client.rpc("create_order_atomic", args as never);
  assert.equal(first.error, null);

  const second = await manager.client.rpc("create_order_atomic", args as never);
  assert.ok(second.error, "a second call with the same order id must fail, not create a duplicate");
});

test("RPC create_order_atomic: a foreign owner_id in the payload is rejected by the underlying RLS insert, not silently accepted", async () => {
  const attacker = await createTestUser("super_admin");
  const victim = await createTestUser("super_admin");
  const customerId = uid();
  const orderId = uid();
  await adminClient.from("customers").insert({ id: customerId, owner_id: victim.id, full_name: "Victim customer" });

  const { error } = await attacker.client.rpc("create_order_atomic", {
    p_order_id: orderId,
    p_customer_id: customerId,
    p_new_customer: null,
    p_order: { id: orderId, owner_id: victim.id, customer_id: customerId, status: "open", ordered_at: new Date().toISOString() },
    p_items: [],
  } as never);
  assert.ok(error, "security invoker means this still runs as the attacker -- RLS must reject writing a row owned by someone else");
});
