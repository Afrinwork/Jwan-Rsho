import assert from "node:assert/strict";
import { test } from "node:test";

import { adminClient, createTestUser } from "./testEnv";

// update_customer_address: the pencil in the trip's customer list.
async function seedCustomerWithOpenOrder(ownerId: string, driverId: string | null) {
  const customerId = crypto.randomUUID();
  const orderId = crypto.randomUUID();
  const old = "2026-01-01T00:00:00Z";
  const { error: customerError } = await adminClient.from("customers").insert({
    id: customerId,
    owner_id: ownerId,
    full_name: "Kunde",
    address: "Alte Strasse 1",
    city: "Berlin",
    country: "Deutschland",
    latitude: 52.5,
    longitude: 13.4,
    assigned_driver_id: driverId,
  });
  if (customerError) throw customerError;
  const { error: orderError } = await adminClient.from("orders").insert({
    id: orderId,
    owner_id: ownerId,
    customer_id: customerId,
    status: "open",
    ordered_at: old,
    assigned_driver_id: driverId,
    updated_at: old,
  });
  if (orderError) throw orderError;
  return { customerId, orderId, old };
}

const newAddress = {
  p_address: "Neue Strasse 5",
  p_city: "Hamburg",
  p_normalized_city: "hamburg",
  p_country: "Deutschland",
  p_latitude: 53.55,
  p_longitude: 9.99,
};

async function readCustomer(id: string) {
  const { data } = await adminClient.from("customers").select("address, city, latitude, longitude, location_status").eq("id", id).single();
  return data;
}

test("customer address: the owner can change it, and the open orders are touched for the live reload", async () => {
  const admin = await createTestUser("admin");
  const { customerId, orderId, old } = await seedCustomerWithOpenOrder(admin.id, null);

  const { error } = await admin.client.rpc("update_customer_address", { p_customer_id: customerId, ...newAddress });
  assert.equal(error, null);

  assert.deepEqual(await readCustomer(customerId), {
    address: "Neue Strasse 5",
    city: "Hamburg",
    latitude: 53.55,
    longitude: 9.99,
    location_status: "ok",
  });
  const { data: order } = await adminClient.from("orders").select("updated_at").eq("id", orderId).single();
  assert.ok(Date.parse(order!.updated_at) > Date.parse(old));
});

test("customer address: the assigned driver can change it", async () => {
  const admin = await createTestUser("admin");
  const driver = await createTestUser("driver", admin.id);
  const { customerId } = await seedCustomerWithOpenOrder(admin.id, driver.id);

  const { error } = await driver.client.rpc("update_customer_address", { p_customer_id: customerId, ...newAddress });
  assert.equal(error, null);
  assert.equal((await readCustomer(customerId))?.address, "Neue Strasse 5");
});

test("customer address: another driver or another admin can't change it", async () => {
  const admin = await createTestUser("admin");
  const driver = await createTestUser("driver", admin.id);
  const otherDriver = await createTestUser("driver", admin.id);
  const otherAdmin = await createTestUser("admin");
  const { customerId } = await seedCustomerWithOpenOrder(admin.id, driver.id);

  for (const stranger of [otherDriver, otherAdmin]) {
    const { error } = await stranger.client.rpc("update_customer_address", { p_customer_id: customerId, ...newAddress });
    assert.ok(error, "expected not-allowed");
  }
  assert.equal((await readCustomer(customerId))?.address, "Alte Strasse 1");
});
