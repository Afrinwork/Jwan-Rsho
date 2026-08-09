import { adminService } from "@/src/features/admin/services/adminService";
import { customerRepository } from "@/src/repositories/customerRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { AdminDashboardStats } from "@/src/types/admin";

export const adminDashboardService = {
  async loadStats(ownerId: string): Promise<AdminDashboardStats> {
    const [activeUsers, ownCustomers, ownOpenOrders, ownTotalOrders] =
      await Promise.all([
        adminService.getActiveUserCount(),
        customerRepository.countCustomersByOwner(ownerId),
        orderRepository.countOpenOrdersByOwner(ownerId),
        orderRepository.countOrdersByOwner(ownerId),
      ]);

    return {
      activeUsers,
      ownCustomers,
      ownOpenOrders,
      ownTotalOrders,
    };
  },
};
