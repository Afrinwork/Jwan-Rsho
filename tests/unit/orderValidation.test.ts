import test from "node:test";
import assert from "node:assert/strict";

import { orderItemSchema } from "@/src/features/orders/validation/orderItemSchema";
import { orderSchema } from "@/src/features/orders/validation/orderSchema";

test("order item quantity must be greater than 0", () => {
  assert.throws(
    () => orderItemSchema.parse({ productId: "p1", productNameSnapshot: "Cheese", quantity: 0, unit: "kg", sortOrder: 0 }),
  );
});

test("order without products is rejected", () => {
  assert.throws(
    () => orderSchema.parse({ customerId: "c1", items: [] }),
  );
});
