import test from "node:test";
import assert from "node:assert/strict";

import { buildCityProductTotals } from "@/src/features/cities/services/cityProductTotalsService";

test("city product totals sum only open order items by product and unit", () => {
  const totals = buildCityProductTotals([
    {
      id: "o1",
      ownerId: "u1",
      customerId: "c1",
      status: "open",
      orderedAt: "2026-08-08T10:00:00.000Z",
      createdAt: "",
      updatedAt: "",
      items: [
        { id: "i1", productId: "p1", productNameSnapshot: "Kaese", quantity: 12, unit: "kg", sortOrder: 0 },
        { id: "i2", productId: "p2", productNameSnapshot: "Labneh", quantity: 5, unit: "kg", sortOrder: 1 },
      ],
    },
    {
      id: "o2",
      ownerId: "u1",
      customerId: "c2",
      status: "open",
      orderedAt: "2026-08-08T11:00:00.000Z",
      createdAt: "",
      updatedAt: "",
      items: [
        { id: "i3", productId: "p1", productNameSnapshot: "Kaese", quantity: 8, unit: "kg", sortOrder: 0 },
      ],
    },
    {
      id: "o3",
      ownerId: "u1",
      customerId: "c3",
      status: "completed",
      orderedAt: "2026-08-08T12:00:00.000Z",
      createdAt: "",
      updatedAt: "",
      items: [
        { id: "i4", productId: "p3", productNameSnapshot: "Oliven", quantity: 9, unit: "kg", sortOrder: 0 },
      ],
    },
  ]);

  assert.deepEqual(totals, [
    { productKey: "p1:kg", productName: "Kaese", quantity: 20, unit: "kg" },
    { productKey: "p2:kg", productName: "Labneh", quantity: 5, unit: "kg" },
  ]);
});
