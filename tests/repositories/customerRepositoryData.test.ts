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
  assert.equal("assignedDriverId" in customer, false);
});

test("customer create data passes through assignedDriverId when provided", () => {
  const customer = buildCustomerCreateData({
    fullName: "Ali",
    phone: "123",
    address: "Main 5, 20095",
    city: "Hamburg",
    country: "DE",
    assignedDriverId: "driver_1",
  }, "uid_1");

  assert.equal(customer.assignedDriverId, "driver_1");
});

test("customer create data derives locationStatus 'failed' when geocoding produced no coordinates (never silently drops the customer)", () => {
  const customer = buildCustomerCreateData({
    fullName: "Ali",
    phone: "123",
    address: "Main 5, 20095",
    city: "Hamburg",
    country: "DE",
  }, "uid_1");

  assert.equal(customer.locationStatus, "failed");
});

test("customer create data derives locationStatus 'ok' when coordinates are present", () => {
  const customer = buildCustomerCreateData({
    fullName: "Ali",
    phone: "123",
    address: "Main 5, 20095",
    city: "Hamburg",
    country: "DE",
    latitude: 53.55,
    longitude: 9.99,
  }, "uid_1");

  assert.equal(customer.locationStatus, "ok");
});

test("customer create data keeps an explicitly supplied locationStatus instead of re-deriving it", () => {
  const customer = buildCustomerCreateData({
    fullName: "Ali",
    phone: "123",
    address: "Main 5, 20095",
    city: "Hamburg",
    country: "DE",
    locationStatus: "pending",
  }, "uid_1");

  assert.equal(customer.locationStatus, "pending");
});
