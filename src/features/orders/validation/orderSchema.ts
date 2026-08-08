import { z } from "zod";

import { customerSchema } from "@/src/features/customers/validation/customerSchema";
import { orderItemSchema } from "@/src/features/orders/validation/orderItemSchema";

export const orderSchema = z.object({
  id: z.string().optional(),
  ownerId: z.string().optional(),
  customerId: z.string().trim().optional(),
  customer: customerSchema.optional(),
  status: z.enum(["open", "completed", "cancelled"]).default("open"),
  note: z.string().trim().optional(),
  orderedAt: z.string().optional(),
  completedAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "Order must include at least one product"),
});
