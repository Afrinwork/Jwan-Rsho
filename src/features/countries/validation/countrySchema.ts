import { z } from "zod";

export const countrySchema = z.object({
  id: z.string().optional(),
  ownerId: z.string().optional(),
  name: z.string().trim().min(1, "Land erforderlich"),
  normalizedName: z.string().optional(),
  isoCode: z.string().trim().max(3, "ISO-Code darf hoechstens 3 Zeichen haben").optional(),
  sortOrder: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
