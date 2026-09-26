import test from "node:test";
import assert from "node:assert/strict";

import { buildDriverOpenCustomers } from "@/src/features/admin/services/driverOpenCustomersService";
import { Order } from "@/src/types/order";

function order(id: string, customerId: string, assignedDriverId: string, hiddenFromDriver?: boolean): Order {
  return {
    id,
    customerId,
    assignedDriverId,
    hiddenFromDriver,
    ownerId: "owner",
    status: "open",
    orderedAt: "2026-09-26T08:00:00.000Z",
    createdAt: "2026-09-26T08:00:00.000Z",
    updatedAt: "2026-09-26T08:00:00.000Z",
  } as Order;
}

test("buildDriverOpenCustomers lists the driver's customers and which are fully hidden", () => {
  const result = buildDriverOpenCustomers(
    [
      order("o1", "berlin1", "d1", true),
      order("o2", "berlin2", "d1", true),
      order("o3", "hannover1", "d1"),
      order("o4", "mixed", "d1", true),
      order("o5", "mixed", "d1", false),
      order("o6", "other", "d2"),
    ],
    "d1",
  );
  assert.deepEqual(result.customerIds.sort(), ["berlin1", "berlin2", "hannover1", "mixed"]);
  assert.deepEqual([...result.hiddenCustomerIds].sort(), ["berlin1", "berlin2"]);
});
