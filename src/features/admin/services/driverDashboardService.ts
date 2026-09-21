import { DriverCheckIn } from "@/src/types/driverCheckIn";
import { Order } from "@/src/types/order";
import { UserProfile } from "@/src/types/user";

export type DriverDashboardEntry = {
  driver: UserProfile;
  openCount: number;
  completedToday: number;
  notDoneCount: number;
  assignedCustomerIds: string[];
  checkIn: DriverCheckIn | null;
};

export type DriverDashboardTotals = {
  driverCount: number;
  activeDriverCount: number;
  checkedInCount: number;
  blockedCheckInCount: number;
  openCount: number;
  completedToday: number;
  notDoneCount: number;
};

export function buildDriverDashboardEntries({
  checkIns,
  completedCounts,
  drivers,
  openOrders,
}: {
  checkIns: DriverCheckIn[];
  completedCounts: Map<string, number>;
  drivers: UserProfile[];
  openOrders: Order[];
}) {
  const checkInByDriverId = new Map(checkIns.map((checkIn) => [checkIn.driverId, checkIn]));
  const openOrdersByDriverId = new Map<string, Order[]>();

  openOrders.forEach((order) => {
    if (!order.assignedDriverId) return;
    openOrdersByDriverId.set(order.assignedDriverId, [...(openOrdersByDriverId.get(order.assignedDriverId) ?? []), order]);
  });

  const entries: DriverDashboardEntry[] = drivers.map((driver) => {
    const driverOpenOrders = openOrdersByDriverId.get(driver.id) ?? [];
    return {
      driver,
      openCount: driverOpenOrders.length,
      completedToday: completedCounts.get(driver.id) ?? 0,
      notDoneCount: driverOpenOrders.length,
      assignedCustomerIds: [...new Set(driverOpenOrders.map((order) => order.customerId))],
      checkIn: checkInByDriverId.get(driver.id) ?? null,
    };
  });

  const totals = entries.reduce<DriverDashboardTotals>(
    (current, entry) => ({
      driverCount: current.driverCount + 1,
      activeDriverCount: current.activeDriverCount + (entry.driver.isActive === false ? 0 : 1),
      checkedInCount: current.checkedInCount + (entry.checkIn?.status === "ok" ? 1 : 0),
      blockedCheckInCount: current.blockedCheckInCount + (entry.checkIn?.status === "blocked" ? 1 : 0),
      openCount: current.openCount + entry.openCount,
      completedToday: current.completedToday + entry.completedToday,
      notDoneCount: current.notDoneCount + entry.notDoneCount,
    }),
    {
      driverCount: 0,
      activeDriverCount: 0,
      checkedInCount: 0,
      blockedCheckInCount: 0,
      openCount: 0,
      completedToday: 0,
      notDoneCount: 0,
    },
  );

  return { entries, totals };
}
