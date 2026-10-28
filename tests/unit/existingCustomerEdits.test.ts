import test from "node:test";
import assert from "node:assert/strict";

import { diffExistingCustomerEdits } from "@/src/features/orders/services/existingCustomerEdits";
import { Customer } from "@/src/types/customer";

const customer = {
  id: "c1",
  ownerId: "u1",
  fullName: "Nonos",
  phone: "",
  address: "",
  city: "99867 Gotha",
  normalizedCity: "gotha",
  country: "Deutschland",
  isActive: true,
  createdAt: "",
  updatedAt: "",
} as Customer;
const unchanged = { fullName: "Nonos", phone: "", note: "", address: "", city: "99867 Gotha", country: "Deutschland", region: "" };

test("no edits on the form means nothing to save for the customer", () => {
  assert.equal(diffExistingCustomerEdits(customer, unchanged), null);
});

test("a street added on the order form is saved and needs geocoding", () => {
  const edits = diffExistingCustomerEdits(customer, { ...unchanged, address: "Hauptstraße 5" });
  assert.deepEqual(edits, { changes: { address: "Hauptstraße 5" }, locationChanged: true });
});

test("a new phone number alone does not geocode again", () => {
  const edits = diffExistingCustomerEdits(customer, { ...unchanged, phone: "0176 123" });
  assert.deepEqual(edits, { changes: { phone: "0176 123" }, locationChanged: false });
});
