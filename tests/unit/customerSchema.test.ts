import test from "node:test";
import assert from "node:assert/strict";

import { customerSchema } from "@/src/features/customers/validation/customerSchema";

const validCustomer = {
  fullName: "Max Mustermann",
  phone: "01701234567",
  address: "Hauptstrasse 12, 10115",
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

test("Kunde: missing address is rejected", () => {
  const parsed = customerSchema.safeParse({ ...validCustomer, address: "" });
  assert.equal(parsed.success, false);
});

test("Kunde: valid customer is accepted", () => {
  const parsed = customerSchema.safeParse(validCustomer);
  assert.equal(parsed.success, true);
});
