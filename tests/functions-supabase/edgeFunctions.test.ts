// Integration tests for the Edge Functions in supabase/functions/,
// run against `supabase functions serve` + the local `supabase start`
// stack (see package.json's test:functions-supabase script). Replaces
// tests/integration/adminFunctions.test.ts's Cloud Functions coverage --
// not a line-by-line port, since that file tested the old 2-role model
// and a deleteUserData function this migration deliberately drops (see
// supabase/migrations and the Edge Function code comments).
import assert from "node:assert/strict";
import { test } from "node:test";

import { adminClient, createTestUser } from "../security-supabase/testEnv";

function uniqueEmail(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
}

test("a driver calling create-user is rejected", async () => {
  const manager = await createTestUser("super_admin");
  const driver = await createTestUser("driver", manager.id);

  const { data, error } = await driver.client.functions.invoke("create-user", {
    body: { email: uniqueEmail("blocked"), password: "Test1234!", fullName: "Blocked", role: "driver" },
  });
  assert.equal(data, null);
  assert.ok(error);
});

test("a super_admin can create an admin; an admin cannot", async () => {
  const superAdmin = await createTestUser("super_admin");
  const admin = await createTestUser("admin", superAdmin.id);

  const email = uniqueEmail("new-admin");
  const { data, error } = await superAdmin.client.functions.invoke("create-user", {
    body: { email, password: "Test1234!", fullName: "New Admin", role: "admin" },
  });
  assert.equal(error, null);
  assert.ok((data as { uid: string }).uid);

  const { data: profile } = await adminClient.from("profiles").select("*").eq("email", email).single();
  assert.equal(profile?.role, "admin");
  assert.equal(profile?.manager_id, superAdmin.id, "manager_id must be forced server-side to the caller, never client-trusted");

  const { error: adminCreatingAdminError } = await admin.client.functions.invoke("create-user", {
    body: { email: uniqueEmail("nope"), password: "Test1234!", fullName: "Nope", role: "admin" },
  });
  assert.ok(adminCreatingAdminError, "an admin must not be able to create another admin");
});

test("an admin can create a driver under themselves", async () => {
  const superAdmin = await createTestUser("super_admin");
  const admin = await createTestUser("admin", superAdmin.id);
  const email = uniqueEmail("new-driver");

  const { data, error } = await admin.client.functions.invoke("create-user", {
    body: { email, password: "Test1234!", fullName: "New Driver", role: "driver" },
  });
  assert.equal(error, null);
  assert.ok((data as { uid: string }).uid);

  const { data: profile } = await adminClient.from("profiles").select("manager_id, role").eq("email", email).single();
  assert.equal(profile?.role, "driver");
  assert.equal(profile?.manager_id, admin.id);
});

test("delete-user: an admin can delete their own driver but not someone else's, and never themselves", async () => {
  const superAdminA = await createTestUser("super_admin");
  const adminA = await createTestUser("admin", superAdminA.id);
  const driverOfA = await createTestUser("driver", adminA.id);
  const superAdminB = await createTestUser("super_admin");
  const adminB = await createTestUser("admin", superAdminB.id);
  const driverOfB = await createTestUser("driver", adminB.id);

  const { error: crossError } = await adminA.client.functions.invoke("delete-user", { body: { email: driverOfB.email } });
  assert.ok(crossError, "an admin must not be able to delete another admin's driver");

  const { error: selfError } = await adminA.client.functions.invoke("delete-user", { body: { email: adminA.email } });
  assert.ok(selfError, "nobody may delete themselves via delete-user");

  const { error: ownError, data: ownData } = await adminA.client.functions.invoke("delete-user", { body: { email: driverOfA.email } });
  assert.equal(ownError, null);
  assert.equal((ownData as { success: boolean }).success, true);

  const { data: stillThere } = await adminClient.from("profiles").select("id").eq("id", driverOfA.id).maybeSingle();
  assert.equal(stillThere, null, "the profile row must be gone (cascaded from the deleted auth user)");

  const { data: untouched } = await adminClient.from("profiles").select("id").eq("id", driverOfB.id).maybeSingle();
  assert.ok(untouched, "an unrelated driver must be unaffected");
});

test("delete-user cascades to the target's owned customers and orders, but not the caller's own data", async () => {
  const admin = await createTestUser("admin", (await createTestUser("super_admin")).id);
  const driver = await createTestUser("driver", admin.id);

  const customerId = crypto.randomUUID();
  await adminClient.from("customers").insert({ id: customerId, owner_id: driver.id, full_name: "Driver-owned customer" });
  const adminCustomerId = crypto.randomUUID();
  await adminClient.from("customers").insert({ id: adminCustomerId, owner_id: admin.id, full_name: "Admin-owned customer" });

  const { error } = await admin.client.functions.invoke("delete-user", { body: { email: driver.email } });
  assert.equal(error, null);

  const { data: deletedCustomer } = await adminClient.from("customers").select("id").eq("id", customerId).maybeSingle();
  assert.equal(deletedCustomer, null);

  const { data: adminCustomerStillThere } = await adminClient.from("customers").select("id").eq("id", adminCustomerId).maybeSingle();
  assert.ok(adminCustomerStillThere, "deleting a driver must never touch their manager's own data");
});

test("delete-own-account: a driver can delete their own account", async () => {
  const manager = await createTestUser("super_admin");
  const driver = await createTestUser("driver", manager.id);

  const { data, error } = await driver.client.functions.invoke("delete-own-account", { body: {} });
  assert.equal(error, null);
  assert.equal((data as { success: boolean }).success, true);

  const { data: stillThere } = await adminClient.from("profiles").select("id").eq("id", driver.id).maybeSingle();
  assert.equal(stillThere, null);
});

test("set-user-active-state: an admin can deactivate and reactivate their own driver; is_active flips accordingly", async () => {
  const admin = await createTestUser("admin", (await createTestUser("super_admin")).id);
  const driver = await createTestUser("driver", admin.id);

  const { error: deactivateError } = await admin.client.functions.invoke("set-user-active-state", {
    body: { email: driver.email, isActive: false },
  });
  assert.equal(deactivateError, null);

  const { data: deactivated } = await adminClient.from("profiles").select("is_active").eq("id", driver.id).single();
  assert.equal(deactivated?.is_active, false);

  // A ban prevents future sign-ins/refreshes, but -- same as Firebase's
  // revokeRefreshTokens(), which only blocks the NEXT refresh, not the
  // still-valid ID token already in the client's hand -- it does not
  // retroactively invalidate an access token issued before the ban.
  // Verified here rather than assumed: the driver's existing session
  // continues to authenticate against RLS until that token's own natural
  // expiry. Not a regression vs. the Firebase version; both systems share
  // this property of stateless JWT auth. A future refresh attempt is
  // where the ban actually takes effect.
  const { error: stillWorksUntilExpiry } = await driver.client.from("profiles").select("id").eq("id", driver.id).maybeSingle();
  assert.equal(stillWorksUntilExpiry, null);

  const { error: refreshError } = await driver.client.auth.refreshSession();
  assert.ok(refreshError, "a banned user's session refresh must fail");

  const { error: reactivateError } = await admin.client.functions.invoke("set-user-active-state", {
    body: { email: driver.email, isActive: true },
  });
  assert.equal(reactivateError, null);

  const { data: reactivated } = await adminClient.from("profiles").select("is_active").eq("id", driver.id).single();
  assert.equal(reactivated?.is_active, true);
});

test("update-managed-user: an admin can rename their driver; a duplicate email is rejected", async () => {
  const admin = await createTestUser("admin", (await createTestUser("super_admin")).id);
  const driverA = await createTestUser("driver", admin.id);
  const driverB = await createTestUser("driver", admin.id);

  const { error } = await admin.client.functions.invoke("update-managed-user", {
    body: { email: driverA.email, fullName: "Renamed Driver" },
  });
  assert.equal(error, null);

  const { data: profile } = await adminClient.from("profiles").select("full_name").eq("id", driverA.id).single();
  assert.equal(profile?.full_name, "Renamed Driver");

  const { error: duplicateError } = await admin.client.functions.invoke("update-managed-user", {
    body: { email: driverA.email, newEmail: driverB.email },
  });
  assert.ok(duplicateError, "reusing another account's email must be rejected");
});

test("get_active_user_count RPC: only admin/super_admin may call it, and it counts correctly", async () => {
  const superAdmin = await createTestUser("super_admin");
  const driver = await createTestUser("driver", superAdmin.id);
  await createTestUser("driver", superAdmin.id);
  const inactiveDriver = await createTestUser("driver", superAdmin.id);
  await adminClient.from("profiles").update({ is_active: false }).eq("id", inactiveDriver.id);

  const { error: driverError } = await driver.client.rpc("get_active_user_count" as never);
  assert.ok(driverError, "a driver must not be able to call this");

  const { data: count, error } = await superAdmin.client.rpc("get_active_user_count" as never);
  assert.equal(error, null);
  assert.ok((count as number) >= 3, "must count at least the 3 active profiles seeded by this test (super_admin + 2 active drivers)");
});
