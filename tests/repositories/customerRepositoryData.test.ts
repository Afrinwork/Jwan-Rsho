import test from "node:test";
import assert from "node:assert/strict";

import { buildCustomerCreateData } from "@/src/repositories/customerRepositoryData";

test("customer create data sets ownerId and normalizedCity", () => {
  const customer = buildCustomerCreateData({
    fullName: "Ali",
    phone: "123",
    address: "Main 5, 20095",
    city: " Hamburg ",
    country: "DE",
  }, "uid_1");

  assert.equal(customer.ownerId, "uid_1");
  assert.equal(customer.normalizedCity, "hamburg");
});

test("customer create data never contains undefined optional fields (Firestore rejects undefined field values)", () => {
  const customer = buildCustomerCreateData({
    fullName: "Ali",
    phone: "123",
    address: "Main 5, 20095",
    city: "Hamburg",
    country: "DE",
  }, "uid_1");

  assert.equal("region" in customer, false);
  assert.equal("note" in customer, false);
  assert.equal("latitude" in customer, false);
  assert.equal("longitude" in customer, false);
});
