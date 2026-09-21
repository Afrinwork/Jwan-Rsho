import { TimestampValue } from "@/src/types/common";
import { OrderItem } from "@/src/types/orderItem";

export type OrderStatus = "open" | "completed" | "cancelled";

export type Order = {
  id: string;
  ownerId: string;
  customerId: string;
  status: OrderStatus;
  // Client-generated once per save attempt and reused across retries of that
  // SAME attempt (a double-tap, a retry after a network error) — the id of
  // this document is the real dedup key (see orderRepository.createOrder's
  // transaction), this field just makes a duplicate independently detectable
  // by the data-integrity diagnostic even if two separate documents ever
  // ended up sharing one, e.g. from a client bug that generated the doc id
  // itself unsafely.
  requestId?: string;
  note?: string;
  // Mirrored from the customer's assignedDriverId at write time (never set
  // directly by the client) so driver-read Firestore rules on this collection
  // stay a plain field comparison instead of a get() lookup to the customer.
  assignedDriverId?: string;
  orderedAt: TimestampValue;
  completedAt?: TimestampValue;
  createdAt: TimestampValue;
  updatedAt: TimestampValue;
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};
