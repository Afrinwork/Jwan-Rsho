import test from "node:test";
import assert from "node:assert/strict";

import { buildCustomerCreateData } from "@/src/repositories/customerRepositoryData";

test("customer create data sets ownerId and normalizedCity", () => {
  const customer = buildCustomerCreateData({
    fullName: "Ali",
    phone: "123",
    street: "Main",
    houseNumber: "5",
    postalCode: "20095",
    city: " Hamburg ",
    country: "DE",
  }, "uid_1");

  assert.equal(customer.ownerId, "uid_1");
  assert.equal(customer.normalizedCity, "hamburg");
});
