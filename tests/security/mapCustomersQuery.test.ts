import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { assertFails, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, documentId, getDocs, query, setDoc, where } from "firebase/firestore";

import { createTestEnv } from "./testEnv";

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await createTestEnv("demo-rsho-map-query");
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

// Regression test for a real production bug: the map screen used to fetch
// customers via `where("ownerId","==",uid) + where(documentId(),"in",ids)`.
// Firestore's rules engine can't prove that query safe when even one id in
// the list belongs to another owner (e.g. a stale reference left over from
// an account migration) — it rejects the WHOLE query with permission-denied,
// even though the ownerId filter would have excluded that id from the
// result anyway. customerRepository.getCustomersByIds() now avoids this by
// filtering an already owner-scoped list client-side instead of querying by
// document id. This test documents the trap so nobody reintroduces it.
test("a documentId() in[] query fails outright if any id belongs to a different owner", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "customers", "c1"), { ownerId: "userA", name: "Mine" });
    await setDoc(doc(context.firestore(), "customers", "c2"), { ownerId: "userB", name: "Not mine" });
  });

  const userA = testEnv.authenticatedContext("userA");
  const q = query(
    collection(userA.firestore(), "customers"),
    where("ownerId", "==", "userA"),
    where(documentId(), "in", ["c1", "c2"]),
  );

  await assertFails(getDocs(q));
});

// Proves the fix: getCustomersByIds() now reads via plain `where("ownerId","==",uid)`
// (no documentId() in[]) and filters client-side, so a foreign-owned doc existing
// in the collection can no longer take down the whole read — it's just absent
// from the owner-scoped result.
test("a plain ownerId-equality list query still succeeds and simply excludes a foreign-owned document", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "customers", "c1"), { ownerId: "userA", name: "Mine" });
    await setDoc(doc(context.firestore(), "customers", "c2"), { ownerId: "userB", name: "Not mine" });
  });

  const userA = testEnv.authenticatedContext("userA");
  const q = query(collection(userA.firestore(), "customers"), where("ownerId", "==", "userA"));
  const snapshot = await getDocs(q);

  assert.equal(snapshot.docs.length, 1);
  assert.equal(snapshot.docs[0].id, "c1");
});
