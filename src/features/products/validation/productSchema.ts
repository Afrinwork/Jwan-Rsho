import { z } from "zod";

export const productSchema = z.object({
  id: z.string().optional(),
  ownerId: z.string().optional(),
  name: z.string().trim().min(1, "Name required"),
  normalizedName: z.string().optional(),
  defaultUnit: z.string().trim().min(1, "Unit required"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
