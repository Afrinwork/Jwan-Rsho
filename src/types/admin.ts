export type AdminDashboardStats = {
  activeUsers: number;
  ownCustomers: number;
  ownOpenOrders: number;
  ownTotalOrders: number;
};

export type DeleteUserInput = {
  identifier: string;
};
