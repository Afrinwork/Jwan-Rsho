import { z } from "zod";

export const orderItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().trim().min(1, "Product required"),
  productNameSnapshot: z.string().trim().min(1, "Product name required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().trim().min(1, "Unit required"),
  sortOrder: z.number().int().nonnegative().default(0),
});
