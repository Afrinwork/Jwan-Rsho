import test from "node:test";
import assert from "node:assert/strict";

import { buildProductTotals } from "@/src/utils/orderItemTotals";

test("product totals sum only open order items by product and unit", () => {
  const totals = buildProductTotals([
    {
      id: "o1",
      ownerId: "u1",
      customerId: "c1",
      status: "open",
      orderedAt: "",
      createdAt: "",
      updatedAt: "",
      items: [
        { id: "i1", productId: "p1", productNameSnapshot: "Kaese", quantity: 2, unit: "kg", sortOrder: 0 },
        { id: "i2", productId: "p2", productNameSnapshot: "Labneh", quantity: 1, unit: "kg", sortOrder: 1 },
      ],
    },
    {
      id: "o2",
      ownerId: "u1",
      customerId: "c2",
      status: "completed",
      orderedAt: "",
      createdAt: "",
      updatedAt: "",
      items: [{ id: "i3", productId: "p3", productNameSnapshot: "Oliven", quantity: 9, unit: "kg", sortOrder: 0 }],
    },
  ]);

  assert.deepEqual(totals, [
    { productKey: "p1:kg", productName: "Kaese", quantity: 2, unit: "kg" },
    { productKey: "p2:kg", productName: "Labneh", quantity: 1, unit: "kg" },
  ]);
});
