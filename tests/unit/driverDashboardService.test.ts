import test from "node:test";
import assert from "node:assert/strict";

import { buildDriverDashboardEntries } from "@/src/features/admin/services/driverDashboardService";
import { DriverCheckIn } from "@/src/types/driverCheckIn";
import { Order } from "@/src/types/order";
import { UserProfile } from "@/src/types/user";

function driver(id: string, overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id,
    email: `${id}@example.com`,
    fullName: `Driver ${id}`,
    role: "driver",
    isActive: true,
    managerId: "owner",
    ...overrides,
  };
}

function order(id: string, assignedDriverId: string, customerId: string): Order {
  return {
    id,
    ownerId: "owner",
    assignedDriverId,
    customerId,
    status: "open",
    orderedAt: "2026-09-17T08:00:00.000Z",
    createdAt: "2026-09-17T08:00:00.000Z",
    updatedAt: "2026-09-17T08:00:00.000Z",
  };
}

function checkIn(driverId: string, overrides: Partial<DriverCheckIn> = {}): DriverCheckIn {
  return {
    id: `${driverId}_2026-09-17`,
    ownerId: "owner",
    driverId,
    date: "2026-09-17",
    status: "ok",
    attempts: 0,
    address: "Hauptstrasse 1, Berlin",
    odometerKm: 12345,
    createdAt: "2026-09-17T08:00:00.000Z",
    updatedAt: "2026-09-17T09:00:00.000Z",
    ...overrides,
  };
}

test("driver dashboard combines live check-ins, open orders, completed counts, and unique customer ids", () => {
  const dashboard = buildDriverDashboardEntries({
    drivers: [driver("d1"), driver("d2", { isActive: false })],
    openOrders: [order("o1", "d1", "c1"), order("o2", "d1", "c1"), order("o3", "d2", "c2")],
    completedCounts: new Map([
      ["d1", 4],
      ["d2", 1],
    ]),
    checkIns: [checkIn("d1"), checkIn("d2", { status: "blocked", address: undefined, odometerKm: undefined })],
  });

  assert.equal(dashboard.entries[0].openCount, 2);
  assert.equal(dashboard.entries[0].completedToday, 4);
  assert.equal(dashboard.entries[0].notDoneCount, 2);
  assert.deepEqual(dashboard.entries[0].assignedCustomerIds, ["c1"]);
  assert.equal(dashboard.entries[0].checkIn?.address, "Hauptstrasse 1, Berlin");
  assert.deepEqual(dashboard.totals, {
    driverCount: 2,
    activeDriverCount: 1,
    checkedInCount: 1,
    blockedCheckInCount: 1,
    openCount: 3,
    completedToday: 5,
    notDoneCount: 3,
  });
});
