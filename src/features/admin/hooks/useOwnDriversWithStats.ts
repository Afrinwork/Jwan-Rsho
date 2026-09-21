import { useCallback, useEffect, useState } from "react";

import {
  buildDriverDashboardEntries,
  DriverDashboardEntry,
  DriverDashboardTotals,
} from "@/src/features/admin/services/driverDashboardService";
import { driverCheckInRepository } from "@/src/repositories/driverCheckInRepository";
import { driverStatsRepository, todayKey } from "@/src/repositories/driverStatsRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { userRepository } from "@/src/repositories/userRepository";
import { DriverCheckIn } from "@/src/types/driverCheckIn";
import { Order } from "@/src/types/order";
import { UserProfile } from "@/src/types/user";
import { formatError } from "@/src/utils/formatError";

export type DriverWithStats = DriverDashboardEntry;

// Live dashboard data for the "meine Fahrer" screen: each of the caller's
// own drivers, with a live count of their currently open (assigned)
// deliveries and how many they've completed today. Both counts update on
// their own via Firestore listeners — no manual refresh needed while the
// screen is open.
export function useOwnDriversWithStats() {
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [completedCounts, setCompletedCounts] = useState<Map<string, number>>(new Map());
  const [checkIns, setCheckIns] = useState<DriverCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setDrivers(await userRepository.getOwnDrivers());
    } catch (loadError) {
      setError(formatError(loadError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadDrivers();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadDrivers]);

  useEffect(() => {
    const unsubscribe = orderRepository.subscribeToOpenOrders(
      setOpenOrders,
      () => undefined,
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = driverStatsRepository.subscribeToOwnDriverStats(
      (stats) => {
        const today = todayKey();
        const counts = new Map<string, number>();
        // A stat doc from an earlier day hasn't been reset yet (it only
        // resets on the driver's next completion) — its count is stale and
        // must read as 0 for "today" until that happens.
        stats.forEach((stat) => counts.set(stat.driverId, stat.date === today ? stat.count : 0));
        setCompletedCounts(counts);
      },
      () => undefined,
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = driverCheckInRepository.subscribeToOwnDriverCheckIns(
      todayKey(),
      setCheckIns,
      () => undefined,
    );

    return unsubscribe;
  }, []);

  const dashboard = buildDriverDashboardEntries({ checkIns, completedCounts, drivers, openOrders });
  const driversWithStats: DriverWithStats[] = dashboard.entries;
  const totals: DriverDashboardTotals = dashboard.totals;

  return { driversWithStats, error, loading, reload: loadDrivers, totals };
}
