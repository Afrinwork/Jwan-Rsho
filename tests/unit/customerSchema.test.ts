import test from "node:test";
import assert from "node:assert/strict";

import { customerSchema } from "@/src/features/customers/validation/customerSchema";

const validCustomer = {
  fullName: "Max Mustermann",
  phone: "01701234567",
  street: "Hauptstrasse",
  houseNumber: "12",
  postalCode: "10115",
  city: "Berlin",
  country: "Deutschland",
  region: "",
  note: "",
  isActive: true,
};

test("Kunde: missing name is rejected", () => {
  const parsed = customerSchema.safeParse({ ...validCustomer, fullName: "" });
  assert.equal(parsed.success, false);
});

test("Kunde: missing city is rejected", () => {
  const parsed = customerSchema.safeParse({ ...validCustomer, city: "" });
  assert.equal(parsed.success, false);
});

test("Kunde: missing street is rejected", () => {
  const parsed = customerSchema.safeParse({ ...validCustomer, street: "" });
  assert.equal(parsed.success, false);
});

test("Kunde: missing postal code is rejected", () => {
  const parsed = customerSchema.safeParse({ ...validCustomer, postalCode: "" });
  assert.equal(parsed.success, false);
});
