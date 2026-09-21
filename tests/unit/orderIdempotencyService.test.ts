import test from "node:test";
import assert from "node:assert/strict";

import { isOrderAlreadyExistsError } from "@/src/features/orders/services/orderIdempotencyService";

test("recognizes orderRepository.createOrder's duplicate-order error", () => {
  assert.equal(isOrderAlreadyExistsError(new Error("Order already exists.")), true);
});

test("does not misfire on an unrelated error", () => {
  assert.equal(isOrderAlreadyExistsError(new Error("Customer not found.")), false);
});

test("does not misfire on a non-Error value", () => {
  assert.equal(isOrderAlreadyExistsError("Order already exists."), false);
  assert.equal(isOrderAlreadyExistsError(null), false);
  assert.equal(isOrderAlreadyExistsError(undefined), false);
});
