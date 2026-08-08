import test from "node:test";
import assert from "node:assert/strict";

import { buildAddOrderFormSchema } from "@/src/features/orders/validation/addOrderFormSchema";

const validItem = { productId: "p1", productNameSnapshot: "Kaese", quantity: 2, unit: "kg" };
const validCustomer = {
  fullName: "Max Mustermann",
  phone: "0170 1234567",
  street: "Hauptstrasse",
  houseNumber: "12",
  postalCode: "10115",
  city: "Berlin",
  country: "Deutschland",
};

test("neuer Kunde Formular: valid new-customer payload passes", () => {
  const schema = buildAddOrderFormSchema("new");
  const result = schema.safeParse({ customerId: "", customer: validCustomer, items: [validItem] });
  assert.equal(result.success, true);
});

test("Pflichtfelder: missing required customer fields fail in new mode", () => {
  const schema = buildAddOrderFormSchema("new");
  const result = schema.safeParse({
    customerId: "",
    customer: { ...validCustomer, fullName: "", street: "" },
    items: [validItem],
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const paths = result.error.issues.map((issue) => issue.path.join("."));
    assert.ok(paths.includes("customer.fullName"));
    assert.ok(paths.includes("customer.street"));
  }
});

test("Auswahl bestehender Kunde: existing mode requires a selected customerId", () => {
  const schema = buildAddOrderFormSchema("existing");
  const missing = schema.safeParse({ customerId: "", customer: {}, items: [validItem] });
  assert.equal(missing.success, false);

  const selected = schema.safeParse({ customerId: "customer-1", customer: {}, items: [validItem] });
  assert.equal(selected.success, true);
});

test("Bestellung ohne Produkt: empty items list is rejected", () => {
  const schema = buildAddOrderFormSchema("existing");
  const result = schema.safeParse({ customerId: "customer-1", customer: {}, items: [] });
  assert.equal(result.success, false);
});

test("ungueltige Menge: non-positive item quantity is rejected", () => {
  const schema = buildAddOrderFormSchema("existing");
  const result = schema.safeParse({
    customerId: "customer-1",
    customer: {},
    items: [{ ...validItem, quantity: 0 }],
  });
  assert.equal(result.success, false);
});
