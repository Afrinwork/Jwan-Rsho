import { customerRepository } from "@/src/repositories/customerRepository";
import { orderRepository } from "@/src/repositories/orderRepository";
import { userRepository } from "@/src/repositories/userRepository";
import { AdminDashboardStats } from "@/src/types/admin";

export const adminDashboardService = {
  async loadStats(ownerId: string): Promise<AdminDashboardStats> {
    const [activeUsers, ownCustomers, ownOpenOrders, ownTotalOrders] =
      await Promise.all([
        userRepository.countActiveUsers(),
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
