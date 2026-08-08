import { TimestampValue } from "@/src/types/common";
import { OrderItem } from "@/src/types/orderItem";

export type OrderStatus = "open" | "completed" | "cancelled";

export type Order = {
  id: string;
  ownerId: string;
  customerId: string;
  status: OrderStatus;
  note?: string;
  orderedAt: TimestampValue;
  completedAt?: TimestampValue;
  createdAt: TimestampValue;
  updatedAt: TimestampValue;
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};
