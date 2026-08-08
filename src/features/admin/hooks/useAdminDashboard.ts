import { useEffect, useState } from "react";

import { adminDashboardService } from "@/src/features/admin/services/adminDashboardService";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { AdminDashboardStats } from "@/src/types/admin";
import { formatError } from "@/src/utils/formatError";

const emptyStats: AdminDashboardStats = {
  activeUsers: 0,
  ownCustomers: 0,
  ownOpenOrders: 0,
  ownTotalOrders: 0,
};

export function useAdminDashboard() {
  const user = useCurrentUser();
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    adminDashboardService
      .loadStats(user.uid)
      .then(setStats)
      .catch((value) => setError(formatError(value).message))
      .finally(() => setLoading(false));
  }, [user]);

  return { stats, loading, error };
}
